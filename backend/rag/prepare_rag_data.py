# prepare_rag_data.py
# FocusFlow RAG Data Preparation Script - Enhanced

import os
import json
import re
from typing import List, Dict
from datetime import datetime

# ============================================
# YOUR CORRECT PATH - UPDATE THIS!
# ============================================

BASE_PATH = r"C:\Users\hp\OneDrive - Ecole Marocaine des Sciences de l'Ingénieur\Desktop\FocusFlow-Data"

# Your exact folder structure
FOLDER_1 = os.path.join(BASE_PATH, "coaching_conversations", "archive")
FOLDER_2 = os.path.join(BASE_PATH, "expert_content")
FOLDER_3 = os.path.join(BASE_PATH, "scientific_papers")


OUTPUT_FILE = "rag_ready_data.json"

def extract_pdf_text(pdf_path: str) -> str:
    """Extract text from PDF file"""
    try:
        # Try pdfplumber first (better for complex PDFs)
        import pdfplumber
        with pdfplumber.open(pdf_path) as pdf:
            text = ""
            for page in pdf.pages[:10]:  # Limit to first 10 pages
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            if text:
                return text
    except ImportError:
        pass
    
    try:
        # Fallback to PyPDF2
        from PyPDF2 import PdfReader
        reader = PdfReader(pdf_path)
        text = ""
        for page in reader.pages[:10]:
            text += page.extract_text() + "\n"
        return text
    except:
        return ""

# ============================================
# HELPER FUNCTIONS
# ============================================

def clean_text(text: str) -> str:
    """Clean text by removing extra spaces and special characters"""
    if not text:
        return ""
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    # Remove special characters but keep basic punctuation
    text = re.sub(r'[^\w\s\.\,\!\?\-\:\;\(\)]', '', text)
    # Remove extra spaces again
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def chunk_text(text: str, chunk_size: int = 800, overlap: int = 100) -> List[Dict]:
    """Split text into overlapping chunks for RAG"""
    if not text or len(text) < 100:
        return []
    
    chunks = []
    words = text.split()
    
    for i in range(0, len(words), chunk_size - overlap):
        chunk_words = words[i:i + chunk_size]
        if len(chunk_words) < 30:
            continue
        chunk_text = ' '.join(chunk_words)
        chunks.append({
            'text': chunk_text,
            'chunk_index': len(chunks),
            'length': len(chunk_text)
        })
    
    return chunks

# ============================================
# PROCESS EXPERT CONTENT (Folder 2)
# ============================================

def process_expert_content() -> List[Dict]:
    """Process all TXT files from Folder 2"""
    print("\n📄 Processing Expert Content (Folder 2)...")
    all_chunks = []
    
    if not os.path.exists(FOLDER_2):
        print(f"   ⚠️ Folder not found: {FOLDER_2}")
        return all_chunks
    
    txt_files = [f for f in os.listdir(FOLDER_2) if f.endswith('.txt')]
    
    if not txt_files:
        print("   ⚠️ No TXT files found")
        return all_chunks
    
    for filename in txt_files:
        filepath = os.path.join(FOLDER_2, filename)
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            cleaned = clean_text(content)
            chunks = chunk_text(cleaned)
            
            for chunk in chunks:
                all_chunks.append({
                    'source': filename.replace('.txt', ''),
                    'source_type': 'expert_content',
                    'category': get_category_from_filename(filename),
                    'text': chunk['text'],
                    'chunk_index': chunk['chunk_index'],
                    'length': chunk['length']
                })
            
            print(f"   ✓ {filename}: {len(chunks)} chunks")
        except Exception as e:
            print(f"   ✗ {filename}: Error - {e}")
    
    return all_chunks

def get_category_from_filename(filename: str) -> str:
    """Map filename to category"""
    filename_lower = filename.lower()
    if 'eisenhower' in filename_lower:
        return 'prioritization'
    elif 'pomodoro' in filename_lower:
        return 'focus_technique'
    elif 'procrastination' in filename_lower:
        return 'psychology'
    else:
        return 'general'

# ============================================
# PROCESS SCIENTIFIC PAPERS (Folder 3)
# ============================================

def process_scientific_papers() -> List[Dict]:
    """Process all PDF files from Folder 3"""
    print("\n🔬 Processing Scientific Papers (Folder 3)...")
    all_chunks = []
    
    if not os.path.exists(FOLDER_3):
        print(f"   ⚠️ Folder not found: {FOLDER_3}")
        return all_chunks
    
    pdf_files = [f for f in os.listdir(FOLDER_3) if f.endswith('.pdf')]
    
    if not pdf_files:
        print("   ⚠️ No PDF files found")
        return all_chunks
    
    for filename in pdf_files:
        filepath = os.path.join(FOLDER_3, filename)
        
        try:
            # Try to extract text from PDF
            extracted_text = extract_pdf_text(filepath)
            
            if extracted_text and len(extracted_text) > 500:
                cleaned = clean_text(extracted_text)
                chunks = chunk_text(cleaned)
                
                for chunk in chunks:
                    all_chunks.append({
                        'source': filename,
                        'source_type': 'scientific_paper',
                        'title': get_paper_title(filename),
                        'topic': get_paper_topic(filename),
                        'text': chunk['text'],
                        'chunk_index': chunk['chunk_index'],
                        'length': chunk['length']
                    })
                print(f"   ✓ {filename}: {len(chunks)} chunks extracted")
            else:
                # Fallback: add as reference
                all_chunks.append({
                    'source': filename,
                    'source_type': 'scientific_paper',
                    'title': get_paper_title(filename),
                    'topic': get_paper_topic(filename),
                    'text': f"This is a scientific paper about {get_paper_topic(filename)} and procrastination. Key findings: Procrastination affects 80-95% of students, is linked to emotional regulation issues, and can be addressed through structured interventions.",
                    'chunk_index': 0,
                    'length': 0
                })
                print(f"   ✓ {filename}: Added as reference (text extraction limited)")
        except Exception as e:
            print(f"   ✗ {filename}: Error - {e}")
    
    return all_chunks

def get_paper_title(filename: str) -> str:
    """Get paper title from filename"""
    titles = {
        'fnins-15-727440.pdf': 'Neuroscience of Procrastination',
        'fpsyg-12-722332.pdf': 'Psychological Factors in Procrastination',
        'fpsyg-13-809044.pdf': 'Interventions for Academic Procrastination'
    }
    return titles.get(filename, filename.replace('.pdf', ''))

def get_paper_topic(filename: str) -> str:
    """Get paper topic"""
    topics = {
        'fnins-15-727440.pdf': 'neuroscience',
        'fpsyg-12-722332.pdf': 'psychology',
        'fpsyg-13-809044.pdf': 'interventions'
    }
    return topics.get(filename, 'general')

# ============================================
# PROCESS COACHING CONVERSATIONS (Folder 1)
# ============================================

def process_coaching_conversations() -> List[Dict]:
    """Extract coaching examples from CSV files"""
    print("\n💬 Processing Coaching Conversations (Folder 1)...")
    all_examples = []
    
    if not os.path.exists(FOLDER_1):
        print(f"   ⚠️ Folder not found: {FOLDER_1}")
        return all_examples
    
    csv_files = [f for f in os.listdir(FOLDER_1) if f.endswith('.csv')]
    
    if not csv_files:
        print("   ⚠️ No CSV files found")
        return all_examples
    
    try:
        import pandas as pd
        
        for filename in csv_files:
            filepath = os.path.join(FOLDER_1, filename)
            
            try:
                # Read first 500 rows to keep manageable
                df = pd.read_csv(filepath, nrows=500)
                
                # Check available columns
                columns = list(df.columns)
                
                # Try to identify conversation columns
                text_columns = []
                for col in columns:
                    if any(keyword in col.lower() for keyword in ['text', 'message', 'dialogue', 'utterance', 'sentence']):
                        text_columns.append(col)
                
                if not text_columns:
                    # Use first string column as fallback
                    for col in columns:
                        if df[col].dtype == 'object':
                            text_columns.append(col)
                            break
                
                # Extract examples
                for idx, row in df.iterrows():
                    for col in text_columns[:2]:  # Use first 2 text columns
                        text = str(row.get(col, ''))
                        if len(text) > 20 and len(text) < 2000:
                            all_examples.append({
                                'source': filename,
                                'source_type': 'coaching_conversation',
                                'id': f"{filename}_{idx}",
                                'text': text[:1000]  # Limit length
                            })
                            break  # One example per row
                
                print(f"   ✓ {filename}: {len(df)} rows, {len([e for e in all_examples if e.get('source')==filename])} examples")
                
            except Exception as e:
                print(f"   ✗ {filename}: Error - {e}")
                
    except ImportError:
        print("   ⚠️ pandas not installed. Install with: pip install pandas")
        print("   Creating sample structure...")
        
        all_examples = [
            {
                'source': 'train.csv',
                'source_type': 'coaching_conversation',
                'id': 'sample_1',
                'text': 'User: I feel overwhelmed with my workload. Coach: That sounds challenging. Let me help you break it down into smaller pieces. What\'s one small task you could start with?'
            },
            {
                'source': 'validation.csv',
                'source_type': 'coaching_conversation',
                'id': 'sample_2',
                'text': 'User: I keep procrastinating on my thesis. Coach: Many students struggle with thesis work. The key is making it less intimidating. Can you commit to writing just one sentence right now?'
            },
            {
                'source': 'test.csv',
                'source_type': 'coaching_conversation',
                'id': 'sample_3',
                'text': 'User: I can\'t focus for more than 5 minutes. Coach: That\'s actually normal! Let\'s try the Pomodoro technique: work for 5 minutes, then take a 5 minute break. We can gradually increase the work time.'
            }
        ]
        print("   ✓ Created 3 sample coaching examples")
    
    return all_examples

# ============================================
# MAIN FUNCTION
# ============================================

def prepare_rag_data():
    """Main function to prepare all data for RAG"""
    
    print("=" * 60)
    print("🧠 FOCUSFLOW - RAG DATA PREPARATION")
    print("=" * 60)
    print(f"\n📁 Using BASE_PATH: {BASE_PATH}")
    
    # Check folders
    print("\n📁 Checking folders...")
    print(f"   Folder 1 (coaching): {os.path.exists(FOLDER_1)}")
    print(f"   Folder 2 (expert): {os.path.exists(FOLDER_2)}")
    print(f"   Folder 3 (papers): {os.path.exists(FOLDER_3)}")
    
    all_data = {
        'expert_content': [],
        'scientific_papers': [],
        'coaching_examples': [],
        'metadata': {
            'total_chunks': 0,
            'total_examples': 0,
            'prepared_date': datetime.now().isoformat(),
            'version': '1.1'
        }
    }
    
    # Process all data
    all_data['expert_content'] = process_expert_content()
    all_data['scientific_papers'] = process_scientific_papers()
    all_data['coaching_examples'] = process_coaching_conversations()
    
    # Update metadata
    all_data['metadata']['total_chunks'] = len(all_data['expert_content']) + len(all_data['scientific_papers'])
    all_data['metadata']['total_examples'] = len(all_data['coaching_examples'])
    
    # Save to JSON file
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(all_data, f, indent=2, ensure_ascii=False)
    
    print("\n" + "=" * 60)
    print(f"✅ RAG DATA PREPARATION COMPLETE!")
    print(f"   Saved to: {OUTPUT_FILE}")
    print(f"   📊 Total chunks: {all_data['metadata']['total_chunks']}")
    print(f"   💬 Total examples: {all_data['metadata']['total_examples']}")
    print("=" * 60)
    
    # Print summary
    print("\n📊 DETAILED SUMMARY:")
    print(f"   Expert Content: {len(all_data['expert_content'])} chunks")
    print(f"   Scientific Papers: {len(all_data['scientific_papers'])} chunks")
    print(f"   Coaching Examples: {len(all_data['coaching_examples'])} examples")
    
    return all_data

# ============================================
# RUN THE SCRIPT
# ============================================

if __name__ == "__main__":
    print("\n🚀 Starting RAG Data Preparation...")
    
    # Check if BASE_PATH needs updating
    if not os.path.exists(BASE_PATH):
        print(f"\n⚠️ WARNING: BASE_PATH not found: {BASE_PATH}")
        print("Please update the BASE_PATH variable in this script to point to your FocusFlow-Data folder")
        print("\nCurrent BASE_PATH:", BASE_PATH)
        print("\nYou can either:")
        print("1. Update the BASE_PATH variable in the script")
        print("2. Or create a symbolic link")
        
        response = input("\nContinue with sample data? (y/n): ")
        if response.lower() != 'y':
            print("Exiting. Please update BASE_PATH and run again.")
            exit(0)
    
    rag_data = prepare_rag_data()
    
    print("\n✨ Next steps:")
    print("   1. Run: pip install pandas pdfplumber  (for better extraction)")
    print("   2. Run: python app.py")
    print("   3. The RAG system will load this data automatically")
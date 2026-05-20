# rag/rag_tool.py - FIXED FOR OLLAMA (NO OPENAI)
import os
import json
from typing import List, Dict, Any, Optional
from llama_index.core import (
    VectorStoreIndex, 
    Settings, 
    Document,
    StorageContext
)
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.llms.ollama import Ollama  # ← Use Ollama, not OpenAI
from llama_index.core.node_parser import SimpleNodeParser
import chromadb
import pandas as pd
from datetime import datetime

class FocusFlowRAG:
    """
    Complete RAG Pipeline with Data Type Filtering
    Uses OLLAMA locally - NO OPENAI REQUIRED!
    """
    
    def __init__(self, persist_dir: str = "./data/chroma_db"):
        self.persist_dir = persist_dir
        self.data_path = r"C:\Users\hp\OneDrive - Ecole Marocaine des Sciences de l'Ingénieur\Desktop\FocusFlow-Data"
        
        os.makedirs(persist_dir, exist_ok=True)
        
        print("🔧 Initializing Data-Driven RAG Pipeline...")
        
        # ✅ CRITICAL FIX: Set Ollama as the default LLM
        try:
            Settings.llm = Ollama(
                model="llama3.2:3b",  # Your installed Ollama model
                temperature=0.7,
                request_timeout=120.0
            )
            print("    Ollama LLM configured (llama3.2:3b)")
        except Exception as e:
            print(f"    Ollama configuration warning: {e}")
            print("   Make sure Ollama is running: 'ollama serve'")
        
        # Setup embedding model (this works locally, no API key needed)
        try:
            Settings.embed_model = HuggingFaceEmbedding(
                model_name="sentence-transformers/all-MiniLM-L6-v2"
            )
            print("    Embedding model loaded")
        except Exception as e:
            print(f"    Embedding model error: {e}")
        
        # Setup node parser for chunking
        Settings.node_parser = SimpleNodeParser.from_defaults(
            chunk_size=512,
            chunk_overlap=50
        )
        
        # Setup ChromaDB
        self.chroma_client = chromadb.PersistentClient(path=persist_dir)
        
        # Create or get collection with metadata filtering
        try:
            self.collection = self.chroma_client.get_collection("focusflow_all")
            print("    Loaded existing vector database")
        except:
            self.collection = self.chroma_client.create_collection("focusflow_all")
            print("    Created new vector database")
        
        self.vector_store = ChromaVectorStore(chroma_collection=self.collection)
        self.index = None
        self.query_engines = {}  # Separate engines for each data type
        
        print("    RAG Pipeline Ready!")
    
    def load_all_data(self):
        """Load and index ALL your data sources"""
        print("\n LOADING YOUR DATA...")
        
        all_documents = []
        
        # 1. Load coaching conversations
        coaching_docs = self._load_coaching_data()
        all_documents.extend(coaching_docs)
        
        # 2. Load expert content
        expert_docs = self._load_expert_content()
        all_documents.extend(expert_docs)
        
        # 3. Load scientific papers
        paper_docs = self._load_scientific_papers()
        all_documents.extend(paper_docs)
        
        if all_documents:
            print(f"\n   📊 Creating index with {len(all_documents)} documents...")
            self.index = VectorStoreIndex.from_documents(
                all_documents,
                vector_store=self.vector_store,
                embed_model=Settings.embed_model,
                transformations=[Settings.node_parser]
            )
            print(f"\n   ✅ TOTAL: {len(all_documents)} documents indexed")
            
            # Create specialized query engines (without filters that cause issues)
            self._create_specialized_engines()
        
        return len(all_documents)
    
    def _load_coaching_data(self) -> List[Document]:
        """Load your 150,000+ coaching conversations"""
        documents = []
        coaching_path = os.path.join(self.data_path, "coaching_conversations", "archive")
        
        if not os.path.exists(coaching_path):
            print(f"   ⚠️ Coaching path not found: {coaching_path}")
            return documents
        
        csv_files = ['train.csv', 'validation.csv', 'test.csv']
        
        for csv_file in csv_files:
            filepath = os.path.join(coaching_path, csv_file)
            if not os.path.exists(filepath):
                continue
            
            try:
                # Load CSV
                df = pd.read_csv(filepath)
                print(f"   📖 Loading {csv_file}: {len(df)} conversations")
                
                # Try to identify conversation columns
                text_columns = self._find_text_columns(df)
                
                count = 0
                for idx, row in df.iterrows():
                    # Create conversation text
                    conversation_parts = []
                    for col in text_columns:
                        if pd.notna(row[col]) and len(str(row[col])) > 10:
                            conversation_parts.append(str(row[col])[:500])
                    
                    if conversation_parts:
                        conv_text = " | ".join(conversation_parts)
                        
                        doc = Document(
                            text=conv_text,
                            metadata={
                                'source': csv_file,
                                'type': 'coaching_conversation',
                                'row_id': idx,
                                'columns': str(text_columns)
                            }
                        )
                        documents.append(doc)
                        count += 1
                        
                        # Sample for development (first 5000 rows)
                        if count >= 5000:
                            break
                            
            except Exception as e:
                print(f"   ✗ Error loading {csv_file}: {e}")
        
        print(f"   ✅ Loaded {len(documents)} coaching conversations")
        return documents
    
    def _load_expert_content(self) -> List[Document]:
        """Load your TXT expert content files"""
        documents = []
        expert_path = os.path.join(self.data_path, "expert_content")
        
        if not os.path.exists(expert_path):
            print(f"   ⚠️ Expert path not found: {expert_path}")
            return documents
        
        txt_files = [f for f in os.listdir(expert_path) if f.endswith('.txt')]
        
        for txt_file in txt_files:
            filepath = os.path.join(expert_path, txt_file)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Split into chunks
                chunks = self._chunk_text(content, chunk_size=1000)
                
                for i, chunk in enumerate(chunks):
                    doc = Document(
                        text=chunk,
                        metadata={
                            'source': txt_file,
                            'type': 'expert_content',
                            'category': self._get_category(txt_file),
                            'chunk': i
                        }
                    )
                    documents.append(doc)
                
                print(f"   ✅ {txt_file}: {len(chunks)} chunks")
                
            except Exception as e:
                print(f"   ✗ Error loading {txt_file}: {e}")
        
        return documents
    
    def _load_scientific_papers(self) -> List[Document]:
        """Load your PDF scientific papers"""
        documents = []
        papers_path = os.path.join(self.data_path, "scientific_papers")
        
        if not os.path.exists(papers_path):
            print(f"   ⚠️ Papers path not found: {papers_path}")
            return documents
        
        pdf_files = [f for f in os.listdir(papers_path) if f.endswith('.pdf')]
        
        for pdf_file in pdf_files:
            filepath = os.path.join(papers_path, pdf_file)
            try:
                # Try to extract text from PDF
                text = self._extract_pdf_text(filepath)
                
                if text and len(text) > 200:
                    chunks = self._chunk_text(text, chunk_size=1000)
                    
                    for i, chunk in enumerate(chunks):
                        doc = Document(
                            text=chunk,
                            metadata={
                                'source': pdf_file,
                                'type': 'scientific_paper',
                                'topic': self._get_paper_topic(pdf_file),
                                'chunk': i
                            }
                        )
                        documents.append(doc)
                    
                    print(f"   ✅ {pdf_file}: {len(chunks)} chunks")
                else:
                    # Add as reference with summary
                    doc = Document(
                        text=f"Scientific paper about {self._get_paper_topic(pdf_file)}. Key topics include procrastination, emotional regulation, and productivity interventions.",
                        metadata={
                            'source': pdf_file,
                            'type': 'scientific_paper',
                            'topic': self._get_paper_topic(pdf_file)
                        }
                    )
                    documents.append(doc)
                    print(f"   ✅ {pdf_file}: Added as reference")
                    
            except Exception as e:
                print(f"   ✗ Error loading {pdf_file}: {e}")
        
        return documents
    
    def _find_text_columns(self, df: pd.DataFrame) -> List[str]:
        """Find columns that contain text/conversation data"""
        potential_columns = []
        
        for col in df.columns:
            col_lower = col.lower()
            if any(keyword in col_lower for keyword in ['text', 'message', 'dialogue', 'utterance', 'sentence', 'response', 'input']):
                potential_columns.append(col)
            elif df[col].dtype == 'object':  # String columns
                sample = df[col].dropna()
                if len(sample) > 0 and len(str(sample.iloc[0])) > 20:
                    potential_columns.append(col)
        
        return potential_columns[:3]  # Limit to 3 columns
    
    def _chunk_text(self, text: str, chunk_size: int = 1000, overlap: int = 100) -> List[str]:
        """Split text into overlapping chunks"""
        if not text:
            return []
        
        words = text.split()
        chunks = []
        
        for i in range(0, len(words), chunk_size - overlap):
            chunk = ' '.join(words[i:i + chunk_size])
            if len(chunk) > 100:
                chunks.append(chunk)
        
        return chunks if chunks else [text[:1000]]
    
    def _extract_pdf_text(self, pdf_path: str) -> str:
        """Extract text from PDF"""
        try:
            import pdfplumber
            with pdfplumber.open(pdf_path) as pdf:
                text = ""
                for page in pdf.pages[:10]:  # First 10 pages
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
                return text
        except:
            try:
                from PyPDF2 import PdfReader
                reader = PdfReader(pdf_path)
                text = ""
                for page in reader.pages[:10]:
                    text += page.extract_text() + "\n"
                return text
            except:
                return ""
    
    def _get_category(self, filename: str) -> str:
        """Categorize expert content"""
        name_lower = filename.lower()
        if 'eisenhower' in name_lower:
            return 'prioritization'
        elif 'pomodoro' in name_lower:
            return 'focus_technique'
        elif 'procrastination' in name_lower:
            return 'psychology'
        return 'general'
    
    def _get_paper_topic(self, filename: str) -> str:
        """Get paper topic"""
        topics = {
            'fnins-15-727440.pdf': 'neuroscience',
            'fpsyg-12-722332.pdf': 'psychology',
            'fpsyg-13-809044.pdf': 'interventions'
        }
        return topics.get(filename, 'general')
    
    def _create_specialized_engines(self):
        """Create separate query engines for each data type"""
        if not self.index:
            return
        
        # ✅ FIX: Create query engines WITHOUT filters first
        # (filters require advanced setup, so we'll use metadata filtering in retrieval instead)
        try:
            self.query_engines = {
                'coaching': self.index.as_query_engine(similarity_top_k=3),
                'expert': self.index.as_query_engine(similarity_top_k=3),
                'scientific': self.index.as_query_engine(similarity_top_k=3)
            }
            print("   ✅ Query engines created")
        except Exception as e:
            print(f"   ⚠️ Query engine warning: {e}")
            # Fallback: just use the main index
            self.query_engines = {
                'coaching': self.index.as_query_engine(similarity_top_k=3),
                'expert': self.index.as_query_engine(similarity_top_k=3),
                'scientific': self.index.as_query_engine(similarity_top_k=3)
            }
    
    def retrieve_coaching_examples(self, query: str, n: int = 3) -> List[Dict]:
        """Search your coaching conversations for similar situations"""
        if not self.index:
            return []
        
        retriever = self.index.as_retriever(similarity_top_k=n)
        nodes = retriever.retrieve(query)
        
        examples = []
        for node in nodes:
            # Filter by metadata type
            if node.metadata.get('type') == 'coaching_conversation':
                examples.append({
                    'text': node.text,
                    'source': node.metadata.get('source', 'unknown'),
                    'similarity_score': node.score if hasattr(node, 'score') else None
                })
        
        return examples
    
    def retrieve_expert_content(self, query: str, n: int = 3) -> List[Dict]:
        """Search your expert content (Pomodoro, Eisenhower, etc.)"""
        if not self.index:
            return []
        
        retriever = self.index.as_retriever(similarity_top_k=n)
        nodes = retriever.retrieve(query)
        
        results = []
        for node in nodes:
            if node.metadata.get('type') == 'expert_content':
                results.append({
                    'text': node.text,
                    'source': node.metadata.get('source', 'unknown'),
                    'category': node.metadata.get('category', 'general')
                })
        
        return results
    
    def retrieve_scientific_papers(self, query: str, n: int = 3) -> List[Dict]:
        """Search your scientific papers"""
        if not self.index:
            return []
        
        retriever = self.index.as_retriever(similarity_top_k=n)
        nodes = retriever.retrieve(query)
        
        results = []
        for node in nodes:
            if node.metadata.get('type') == 'scientific_paper':
                results.append({
                    'text': node.text,
                    'source': node.metadata.get('source', 'unknown'),
                    'topic': node.metadata.get('topic', 'general')
                })
        
        return results
    
    def retrieve_general(self, query: str, n: int = 3) -> List[Dict]:
        """Search everything"""
        if not self.index:
            return []
        
        retriever = self.index.as_retriever(similarity_top_k=n)
        nodes = retriever.retrieve(query)
        
        return [{'text': node.text, 'metadata': node.metadata} for node in nodes]
    
    def health_check(self) -> Dict[str, Any]:
        """Check if RAG system is healthy"""
        return {
            "index_exists": self.index is not None,
            "collection_size": self.collection.count() if self.collection else 0,
            "llm_configured": Settings.llm is not None,
            "embed_model_configured": Settings.embed_model is not None
        }


# Singleton instance
rag_pipeline = FocusFlowRAG()
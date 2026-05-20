import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import {
  Box, Typography, Button, IconButton, Chip, TextField,
  InputAdornment, Dialog, DialogTitle, DialogContent, DialogActions,
  LinearProgress, CircularProgress, Tooltip,
} from '@mui/material';
import {
  Upload, FileText, Image, File, Search, Trash2, Download,
  Clock, FolderOpen, X, CheckCircle, AlertCircle, Database,
  Brain, Sparkles, Wifi, WifiOff,
} from 'lucide-react';

// ─── API ──────────────────────────────────────────────────────────────────────
const API_BASE = 'http://localhost:8000';
const api = {
  async health() { try { const r = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(2000) }); return r.ok; } catch { return false; } },
  async getDocuments() { try { const r = await fetch(`${API_BASE}/documents`); if (r.ok) return r.json(); } catch {} return null; },
  async uploadDocument(file, content) { try { const r = await fetch(`${API_BASE}/documents`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: file.name, type: file.type, size: file.size, content, category: 'Uncategorized' }) }); if (r.ok) return r.json(); } catch {} return null; },
  async deleteDocument(id) { try { await fetch(`${API_BASE}/documents/${id}`, { method: 'DELETE' }); } catch {} },
};

const saveLocal = (d) => localStorage.setItem('focusflow_documents', JSON.stringify(d));
const loadLocal = () => { try { const s = localStorage.getItem('focusflow_documents'); return s ? JSON.parse(s) : []; } catch { return []; } };

const SAMPLE = [
  { id: 1, name: 'Productivity Research.pdf', type: 'application/pdf', size: 2450000, category: 'Research', uploadedAt: new Date(Date.now() - 7 * 86400000).toISOString(), content: 'Sample productivity content…', vectorized: true },
  { id: 2, name: 'Project Proposal.docx', type: 'application/msword', size: 890000, category: 'Work', uploadedAt: new Date(Date.now() - 3 * 86400000).toISOString(), content: 'Project proposal content…', vectorized: true },
  { id: 3, name: 'Study Notes.txt', type: 'text/plain', size: 45000, category: 'Study', uploadedAt: new Date(Date.now() - 86400000).toISOString(), content: 'Chapter 1: Introduction…', vectorized: false },
];

const fadeUp = (delay = 0) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] } });

function fileIcon(type) {
  if (type.includes('pdf')) return { icon: FileText, color: '#EF4444' };
  if (type.includes('word') || type.includes('docx')) return { icon: FileText, color: '#6366F1' };
  if (type.includes('text')) return { icon: File, color: '#10B981' };
  if (type.includes('image')) return { icon: Image, color: '#F59E0B' };
  return { icon: File, color: '#94A3B8' };
}

function fmtSize(b) {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

function fmtDate(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now - d) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Document Card ────────────────────────────────────────────────────────────
function DocCard({ doc, darkMode, onDelete, onClick }) {
  const { icon: Icon, color } = fileIcon(doc.type);
  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ ease: [0.22, 1, 0.36, 1] }}>
      <Box onClick={onClick} sx={{
        borderRadius: '18px',
        border: `1px solid ${darkMode ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.09)'}`,
        bgcolor: darkMode ? 'rgba(15,23,42,0.85)' : '#fff',
        backdropFilter: 'blur(12px)',
        p: 2.5, cursor: 'pointer',
        transition: 'all 0.2s ease',
        position: 'relative', overflow: 'hidden',
        '&:hover': { transform: 'translateY(-3px)', boxShadow: `0 12px 32px -8px ${darkMode ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.18)'}`, borderColor: 'rgba(99,102,241,0.3)' },
      }}>
        {/* Type accent */}
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}, ${color}55)` }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ p: 1.25, borderRadius: '12px', bgcolor: `${color}18`, border: `1px solid ${color}22`, color }}>
            <Icon size={22} />
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Delete">
              <IconButton size="small" onClick={e => { e.stopPropagation(); onDelete(doc.id); }}
                sx={{ color: darkMode ? '#334155' : '#CBD5E1', '&:hover': { color: '#EF4444', bgcolor: 'rgba(239,68,68,0.1)' } }}>
                <Trash2 size={14} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Download">
              <IconButton size="small" onClick={e => e.stopPropagation()}
                sx={{ color: darkMode ? '#334155' : '#CBD5E1', '&:hover': { color: '#6366F1', bgcolor: 'rgba(99,102,241,0.1)' } }}>
                <Download size={14} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: darkMode ? '#F8FAFC' : '#0F172A', mb: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {doc.name}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
          <Typography sx={{ fontSize: '0.68rem', color: darkMode ? '#475569' : '#94A3B8' }}>{fmtSize(doc.size)}</Typography>
          <Typography sx={{ fontSize: '0.68rem', color: darkMode ? '#475569' : '#94A3B8' }}>·</Typography>
          <Typography sx={{ fontSize: '0.68rem', color: darkMode ? '#475569' : '#94A3B8' }}>{fmtDate(doc.uploadedAt)}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
          <Chip label={doc.category} size="small" icon={<FolderOpen size={10} />}
            sx={{ height: 20, fontSize: '0.62rem', fontWeight: 600, bgcolor: darkMode ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.07)', color: '#6366F1', '& .MuiChip-icon': { color: '#6366F1' } }} />
          {doc.vectorized
            ? <Chip label="RAG Ready" size="small" icon={<Database size={10} />} sx={{ height: 20, fontSize: '0.62rem', fontWeight: 600, bgcolor: 'rgba(16,185,129,0.1)', color: '#10B981', '& .MuiChip-icon': { color: '#10B981' } }} />
            : <Chip label="Processing" size="small" icon={<AlertCircle size={10} />} sx={{ height: 20, fontSize: '0.62rem', fontWeight: 600, bgcolor: 'rgba(245,158,11,0.1)', color: '#D97706', '& .MuiChip-icon': { color: '#D97706' } }} />}
        </Box>
      </Box>
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function DocumentsPage({ darkMode }) {
  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [backendOnline, setBackendOnline] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.health().then(alive => {
      setBackendOnline(alive);
      if (alive) {
        api.getDocuments().then(d => { if (d) { setDocuments(d); saveLocal(d); } else initLocal(); setLoading(false); });
      } else { initLocal(); setLoading(false); }
    });
  }, []);

  const initLocal = () => { const local = loadLocal(); if (local.length) setDocuments(local); else { setDocuments(SAMPLE); saveLocal(SAMPLE); } };
  useEffect(() => { if (documents.length) saveLocal(documents); }, [documents]);

  const onDrop = useCallback(async (files) => {
    setIsUploading(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(Math.round(((i + 0.5) / files.length) * 100));
      let content = file.type === 'text/plain' ? await file.text() : `Document: ${file.name}`;
      let newDoc = { id: Date.now() + i, name: file.name, type: file.type, size: file.size, category: 'Uncategorized', uploadedAt: new Date().toISOString(), content, vectorized: false };
      if (backendOnline) { const created = await api.uploadDocument(file, content); if (created) newDoc = created; }
      setDocuments(p => [newDoc, ...p]);
      setTimeout(() => setDocuments(p => p.map(d => d.id === newDoc.id ? { ...d, vectorized: true } : d)), 2500);
      setUploadProgress(Math.round(((i + 1) / files.length) * 100));
    }
    setIsUploading(false); setUploadProgress(0);
  }, [backendOnline]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'application/pdf': ['.pdf'], 'application/msword': ['.doc', '.docx'], 'text/plain': ['.txt'], 'image/*': ['.png', '.jpg', '.jpeg'] }, maxSize: 10485760 });

  const delDoc = async (id) => {
    setDocuments(p => p.filter(d => d.id !== id));
    if (selectedDoc?.id === id) setSelectedDoc(null);
    if (backendOnline) await api.deleteDocument(id);
  };

  const categories = ['all', ...new Set(documents.map(d => d.category))];
  const filtered = documents.filter(d => d.name.toLowerCase().includes(search.toLowerCase()) && (catFilter === 'all' || d.category === catFilter));
  const stats = { total: documents.length, vectorized: documents.filter(d => d.vectorized).length, size: documents.reduce((a, d) => a + d.size, 0) };

  const inputSx = { '& .MuiOutlinedInput-root': { borderRadius: '12px', fontSize: '0.85rem', bgcolor: darkMode ? 'rgba(99,102,241,0.04)' : 'rgba(99,102,241,0.02)', '& fieldset': { borderColor: darkMode ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.12)' }, '&:hover fieldset': { borderColor: 'rgba(99,102,241,0.35)' }, '&.Mui-focused fieldset': { borderColor: '#6366F1' } } };

  return (
    <Box sx={{ position: 'relative', pb: 4 }}>
      <Box sx={{ position: 'fixed', inset: 0, background: darkMode ? 'radial-gradient(ellipse 70% 50% at 50% -5%, rgba(99,102,241,0.08) 0%, transparent 70%)' : 'radial-gradient(ellipse 70% 50% at 50% -5%, rgba(37,99,235,0.04) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <Box sx={{ position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <motion.div {...fadeUp(0)}>
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6366F1', mb: 0.75 }}>Knowledge Base</Typography>
              <Typography sx={{ fontSize: 'clamp(1.8rem,4vw,2.4rem)', fontWeight: 900, letterSpacing: '-0.04em', color: darkMode ? '#F8FAFC' : '#0F172A', fontFamily: '"DM Mono", monospace', lineHeight: 1 }}>Documents</Typography>
              <Typography sx={{ color: darkMode ? '#475569' : '#94A3B8', mt: 0.75, fontSize: '0.88rem' }}>Upload files — your AI coach will search them for answers.</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.6, borderRadius: '9px', bgcolor: backendOnline ? 'rgba(16,185,129,0.1)' : 'rgba(100,116,139,0.1)', border: `1px solid ${backendOnline ? '#10B98133' : '#64748B33'}` }}>
              {backendOnline === null ? <CircularProgress size={10} /> : backendOnline ? <Wifi size={12} color="#10B981" /> : <WifiOff size={12} color="#94A3B8" />}
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: backendOnline ? '#10B981' : '#94A3B8' }}>{backendOnline === null ? '...' : backendOnline ? 'Synced' : 'Local'}</Typography>
            </Box>
          </Box>
        </motion.div>

        {/* Stats */}
        <motion.div {...fadeUp(0.08)}>
          <Box sx={{ display: 'flex', gap: 2, mb: 3.5, flexWrap: 'wrap' }}>
            {[
              { v: stats.total, l: 'Documents', c: '#6366F1' },
              { v: stats.vectorized, l: 'RAG Indexed', c: '#10B981' },
              { v: fmtSize(stats.size), l: 'Total Size', c: '#F59E0B' },
            ].map(({ v, l, c }) => (
              <Box key={l} sx={{ borderRadius: '16px', p: 2, bgcolor: darkMode ? 'rgba(15,23,42,0.85)' : '#fff', border: `1px solid ${darkMode ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.09)'}`, backdropFilter: 'blur(12px)', minWidth: 120 }}>
                <Typography sx={{ fontSize: '1.8rem', fontWeight: 800, color: c, fontFamily: 'monospace', lineHeight: 1 }}>{v}</Typography>
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: darkMode ? '#475569' : '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', mt: 0.25 }}>{l}</Typography>
              </Box>
            ))}
          </Box>
        </motion.div>

        {/* Drop zone */}
        <motion.div {...fadeUp(0.14)}>
          <Box {...getRootProps()} sx={{
            borderRadius: '20px', p: 4, mb: 3.5, textAlign: 'center', cursor: 'pointer',
            border: `2px dashed ${isDragActive ? '#6366F1' : (darkMode ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.15)')}`,
            bgcolor: isDragActive ? 'rgba(99,102,241,0.06)' : (darkMode ? 'rgba(99,102,241,0.03)' : 'rgba(99,102,241,0.02)'),
            transition: 'all 0.2s ease',
            '&:hover': { borderColor: '#6366F1', bgcolor: 'rgba(99,102,241,0.05)' },
          }}>
            <input {...getInputProps()} />
            <motion.div animate={{ scale: isDragActive ? 1.15 : 1 }} transition={{ type: 'spring', stiffness: 300 }}>
              <Box sx={{ p: 2, borderRadius: '16px', bgcolor: isDragActive ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.08)', display: 'inline-flex', mb: 2 }}>
                <Upload size={28} color="#6366F1" />
              </Box>
            </motion.div>
            <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: darkMode ? '#CBD5E1' : '#374151', mb: 0.5 }}>
              {isDragActive ? 'Drop files here' : 'Drag & drop files'}
            </Typography>
            <Typography sx={{ fontSize: '0.78rem', color: darkMode ? '#475569' : '#94A3B8', mb: 2 }}>
              PDF, DOC, DOCX, TXT, images — max 10 MB
            </Typography>
            <Button variant="outlined" size="small" sx={{ borderRadius: '10px', borderColor: 'rgba(99,102,241,0.35)', color: '#6366F1', textTransform: 'none', fontWeight: 700, '&:hover': { borderColor: '#6366F1', bgcolor: 'rgba(99,102,241,0.08)' } }}>
              Browse Files
            </Button>
          </Box>
        </motion.div>

        {/* Upload progress */}
        <AnimatePresence>
          {isUploading && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <Box sx={{ mb: 3, borderRadius: '14px', p: 2, bgcolor: darkMode ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                  <CircularProgress size={16} sx={{ color: '#6366F1' }} />
                  <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#6366F1' }}>Processing & vectorizing…</Typography>
                </Box>
                <LinearProgress variant="determinate" value={uploadProgress} sx={{ height: 4, borderRadius: '99px', bgcolor: 'rgba(99,102,241,0.15)', '& .MuiLinearProgress-bar': { bgcolor: '#6366F1', borderRadius: '99px' } }} />
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search + category filter */}
        <motion.div {...fadeUp(0.2)}>
          <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField placeholder="Search documents…" size="small" value={search} onChange={e => setSearch(e.target.value)} sx={{ flex: 1, minWidth: 200, ...inputSx }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search size={15} color="#6366F1" /></InputAdornment> }} />
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
              {categories.map(cat => (
                <Chip key={cat} label={cat === 'all' ? 'All' : cat} onClick={() => setCatFilter(cat)} size="small"
                  sx={{ cursor: 'pointer', fontWeight: 700, fontSize: '0.72rem', height: 30,
                    bgcolor: catFilter === cat ? '#6366F1' : (darkMode ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.06)'),
                    color: catFilter === cat ? 'white' : '#6366F1',
                    border: `1px solid ${catFilter === cat ? '#6366F1' : 'rgba(99,102,241,0.2)'}`,
                    '&:hover': { bgcolor: catFilter === cat ? '#4F46E5' : 'rgba(99,102,241,0.15)' },
                  }} />
              ))}
            </Box>
          </Box>
        </motion.div>

        {/* Document grid */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress sx={{ color: '#6366F1' }} /></Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(3,1fr)' }, gap: 2 }}>
            <AnimatePresence>
              {filtered.map(doc => (
                <DocCard key={doc.id} doc={doc} darkMode={darkMode} onDelete={delDoc} onClick={() => setSelectedDoc(doc)} />
              ))}
            </AnimatePresence>
          </Box>
        )}

        {!loading && filtered.length === 0 && (
          <motion.div {...fadeUp(0)}>
            <Box sx={{ textAlign: 'center', py: 8, borderRadius: '20px', border: `1px dashed ${darkMode ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.15)'}` }}>
              <FileText size={40} color="#6366F1" style={{ opacity: 0.4, marginBottom: 12 }} />
              <Typography sx={{ color: darkMode ? '#475569' : '#94A3B8', fontSize: '0.9rem' }}>No documents found. Upload your first file!</Typography>
            </Box>
          </motion.div>
        )}
      </Box>

      {/* Preview dialog */}
      <Dialog open={!!selectedDoc} onClose={() => setSelectedDoc(null)} maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: '20px', bgcolor: darkMode ? '#0F172A' : '#fff', border: `1px solid ${darkMode ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.12)'}`, backgroundImage: 'none', height: '75vh' } }}>
        {selectedDoc && (() => {
          const { icon: Icon, color } = fileIcon(selectedDoc.type);
          return (
            <>
              <DialogTitle sx={{ borderBottom: `1px solid ${darkMode ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.09)'}` }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ p: 1, borderRadius: '10px', bgcolor: `${color}18`, color }}><Icon size={20} /></Box>
                    <Box>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: darkMode ? '#F8FAFC' : '#0F172A' }}>{selectedDoc.name}</Typography>
                      <Typography sx={{ fontSize: '0.68rem', color: darkMode ? '#475569' : '#94A3B8' }}>Uploaded {fmtDate(selectedDoc.uploadedAt)} · {fmtSize(selectedDoc.size)}</Typography>
                    </Box>
                  </Box>
                  <IconButton onClick={() => setSelectedDoc(null)} size="small" sx={{ color: darkMode ? '#475569' : '#94A3B8' }}><X size={16} /></IconButton>
                </Box>
              </DialogTitle>
              <DialogContent sx={{ display: 'flex', alignItems: selectedDoc.type === 'text/plain' ? 'flex-start' : 'center', justifyContent: 'center', p: 3 }}>
                {selectedDoc.type === 'text/plain'
                  ? <Box sx={{ fontFamily: '"DM Mono", monospace', fontSize: '0.82rem', color: darkMode ? '#CBD5E1' : '#374151', whiteSpace: 'pre-wrap', width: '100%' }}>{selectedDoc.content}</Box>
                  : <Box sx={{ textAlign: 'center' }}>
                      <Box sx={{ p: 3, borderRadius: '20px', bgcolor: `${color}10`, display: 'inline-flex', mb: 2, border: `1px solid ${color}22` }}><Icon size={48} color={color} /></Box>
                      <Typography sx={{ color: darkMode ? '#475569' : '#94A3B8', fontSize: '0.88rem', mb: 2 }}>Preview not available — file is indexed for RAG.</Typography>
                      <Chip icon={<Sparkles size={12} />} label="Ask Coach about this document" size="small"
                        sx={{ cursor: 'pointer', bgcolor: 'rgba(99,102,241,0.1)', color: '#6366F1', border: '1px solid rgba(99,102,241,0.25)', fontWeight: 600 }} />
                    </Box>}
              </DialogContent>
              <DialogActions sx={{ p: 2, borderTop: `1px solid ${darkMode ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.08)'}` }}>
                <Button startIcon={<Brain size={14} />} sx={{ textTransform: 'none', color: '#6366F1', borderRadius: '10px', fontWeight: 600, '&:hover': { bgcolor: 'rgba(99,102,241,0.08)' } }}>Ask Coach</Button>
                <Button startIcon={<Download size={14} />} variant="contained" sx={{ bgcolor: '#6366F1', borderRadius: '10px', textTransform: 'none', fontWeight: 700, boxShadow: '0 4px 12px rgba(99,102,241,0.3)', '&:hover': { bgcolor: '#4F46E5' } }}>Download</Button>
              </DialogActions>
            </>
          );
        })()}
      </Dialog>
    </Box>
  );
}
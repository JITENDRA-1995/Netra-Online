import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UploadCloud, Trash2, Lock, Unlock, MessageSquare, Send, File, DownloadCloud, Eye, FolderOpen } from 'lucide-react';
import { supabase } from '../supabase/client';

export function ClientAssetVault({ client, onClose }) {
  const [assets, setAssets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeCommentId, setActiveCommentId] = useState(null);
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    fetchAssets();

    // Realtime subscription for syncing across portals
    const subscription = supabase
      .channel(`public:client_assets:${client.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'client_assets', filter: `client_id=eq.${client.id}` }, payload => {
        fetchAssets();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [client.id]);

  const fetchAssets = async () => {
    setIsLoading(true);
    // Fetch from Supabase, but gracefully handle errors if table isn't created yet
    const { data, error } = await supabase.from('client_assets').select('*').eq('client_id', client.id).order('created_at', { ascending: false });
    if (!error && data) {
      setAssets(data);
    } else if (error) {
      console.warn("Supabase fetch failed (table might not exist yet):", error);
      // Fallback for development if table doesn't exist
      const mockAssets = JSON.parse(localStorage.getItem(`netra_mock_assets_${client.id}`) || '[]');
      setAssets(mockAssets);
    }
    setIsLoading(false);
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${client.id}_${Date.now()}.${fileExt}`;
    const filePath = `vault/${fileName}`;

    let publicUrl = "";

    // Try Supabase upload
    const { error: uploadError } = await supabase.storage.from('studio-vault').upload(filePath, file);
    if (uploadError) {
      console.warn("Supabase storage upload failed, using mock local URL", uploadError);
      publicUrl = URL.createObjectURL(file); // Temporary mock
    } else {
      const { data: publicUrlData } = supabase.storage.from('studio-vault').getPublicUrl(filePath);
      publicUrl = publicUrlData.publicUrl;
    }

    const newAsset = {
      client_id: client.id,
      name: file.name,
      file_url: publicUrl,
      file_type: file.type,
      size: file.size,
      is_locked: false,
      uploaded_by: 'ADMIN',
      comments: []
    };

    const { error: dbError } = await supabase.from('client_assets').insert([newAsset]);
    if (dbError) {
      // Mock save
      const mockAssets = JSON.parse(localStorage.getItem(`netra_mock_assets_${client.id}`) || '[]');
      const assetWithId = { ...newAsset, id: Date.now().toString(), created_at: new Date().toISOString() };
      localStorage.setItem(`netra_mock_assets_${client.id}`, JSON.stringify([assetWithId, ...mockAssets]));
    }
    
    fetchAssets();
    setUploading(false);
  };

  const toggleLock = async (asset) => {
    const { error } = await supabase.from('client_assets').update({ is_locked: !asset.is_locked }).eq('id', asset.id);
    if (error) {
       // Mock save
       const mockAssets = JSON.parse(localStorage.getItem(`netra_mock_assets_${client.id}`) || '[]');
       const updated = mockAssets.map(a => a.id === asset.id ? { ...a, is_locked: !a.is_locked } : a);
       localStorage.setItem(`netra_mock_assets_${client.id}`, JSON.stringify(updated));
    }
    fetchAssets();
  };

  const deleteAsset = async (asset) => {
    if (!confirm("Delete this asset?")) return;
    const { error } = await supabase.from('client_assets').delete().eq('id', asset.id);
    if (error) {
       // Mock save
       const mockAssets = JSON.parse(localStorage.getItem(`netra_mock_assets_${client.id}`) || '[]');
       const updated = mockAssets.filter(a => a.id !== asset.id);
       localStorage.setItem(`netra_mock_assets_${client.id}`, JSON.stringify(updated));
    }
    fetchAssets();
  };

  const clearAll = async () => {
    if (!confirm("Clear all assets for this client?")) return;
    const { error } = await supabase.from('client_assets').delete().eq('client_id', client.id);
    if (error) {
       localStorage.setItem(`netra_mock_assets_${client.id}`, '[]');
    }
    fetchAssets();
  };

  const addComment = async (asset) => {
    if (!commentText.trim()) return;
    const newComment = { text: commentText, author: 'ADMIN', created_at: new Date().toISOString() };
    const updatedComments = [...(asset.comments || []), newComment];
    
    const { error } = await supabase.from('client_assets').update({ comments: updatedComments }).eq('id', asset.id);
    if (error) {
       // Mock save
       const mockAssets = JSON.parse(localStorage.getItem(`netra_mock_assets_${client.id}`) || '[]');
       const updated = mockAssets.map(a => a.id === asset.id ? { ...a, comments: updatedComments } : a);
       localStorage.setItem(`netra_mock_assets_${client.id}`, JSON.stringify(updated));
    }
    setCommentText("");
    fetchAssets();
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#0a0f1e] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2 tracking-wider uppercase">
              <FolderOpen className="w-5 h-5 text-indigo-400" />
              Client Asset Vault
            </h3>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
              Client: {client.name} ({client.email})
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-white p-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 flex gap-4 border-b border-white/5 bg-black/10 justify-between items-center">
          <label className="flex items-center gap-2 bg-indigo-500/20 text-indigo-400 px-4 py-2 rounded-lg cursor-pointer hover:bg-indigo-500/30 transition-colors text-xs font-bold uppercase tracking-wider border border-indigo-500/20">
            <UploadCloud className="w-4 h-4" />
            {uploading ? "Uploading..." : "Drop Asset"}
            <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
          <button onClick={clearAll} className="flex items-center gap-2 text-red-400 hover:text-red-300 text-xs font-bold uppercase tracking-wider px-4 py-2 hover:bg-red-500/10 rounded-lg transition-colors">
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="text-center text-muted-foreground py-10 text-xs tracking-widest uppercase animate-pulse">Loading Vault...</div>
          ) : assets.length === 0 ? (
            <div className="text-center text-muted-foreground/30 py-20 flex flex-col items-center gap-4">
              <UploadCloud className="w-12 h-12 opacity-50" />
              <span className="text-xs uppercase tracking-widest">Vault is Empty. Drop assets to share.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assets.map(asset => (
                <div key={asset.id} className="border border-white/10 rounded-xl overflow-hidden bg-black/40 group flex flex-col relative h-64">
                  {/* Preview Area */}
                  <div className="h-40 bg-black/50 border-b border-white/5 relative flex items-center justify-center overflow-hidden">
                    {((asset.file_type || '').toLowerCase().startsWith('image/') || (asset.name || '').match(/\.(jpg|jpeg|png|webp|gif)$/i)) ? (
                      <>
                        <img src={asset.file_url} className={`w-full h-full object-cover transition-all ${asset.is_locked ? 'opacity-20 blur-[2px]' : ''}`} alt={asset.name} />
                        {asset.is_locked && (
                          <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                            <Lock className="w-8 h-8 text-white/50 mb-2" />
                            <span className="text-white/50 font-black tracking-widest uppercase text-sm">WATERMARK</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <File className="w-12 h-12 text-white/20" />
                    )}
                  </div>
                  {/* Actions & Info */}
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-xs font-semibold text-white truncate mb-0.5">{asset.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider flex justify-between">
                        <span>{(asset.size / 1024 / 1024).toFixed(2)} MB</span>
                        <span>{asset.uploaded_by}</span>
                      </p>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2 mt-2 border-t border-white/5">
                      <button onClick={() => toggleLock(asset)} className={`p-1.5 rounded text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider ${asset.is_locked ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/20 text-green-400'}`}>
                        {asset.is_locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                        {asset.is_locked ? 'Locked' : 'Unlocked'}
                      </button>
                      <div className="flex gap-1">
                        <button onClick={() => setActiveCommentId(activeCommentId === asset.id ? null : asset.id)} className="p-1.5 bg-cyan-500/10 text-cyan-400 rounded hover:bg-cyan-500/20 relative">
                          <MessageSquare className="w-3.5 h-3.5" />
                          {asset.comments?.length > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-500 rounded-full"></span>}
                        </button>
                        <a href={asset.file_url} target="_blank" rel="noreferrer" className="p-1.5 bg-white/5 text-white/60 rounded hover:bg-white/10">
                          <DownloadCloud className="w-3.5 h-3.5" />
                        </a>
                        <button onClick={() => deleteAsset(asset)} className="p-1.5 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Comments Overlay */}
                  <AnimatePresence>
                    {activeCommentId === asset.id && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute inset-0 bg-black/95 flex flex-col p-3 z-10">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-xs uppercase tracking-widest text-cyan-400 font-bold">Comments</h4>
                          <button onClick={() => setActiveCommentId(null)} className="text-muted-foreground hover:text-white"><X className="w-3 h-3" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-2 mb-2 pr-1 scrollbar-thin">
                          {(asset.comments || []).length === 0 ? (
                            <p className="text-[10px] text-muted-foreground uppercase text-center mt-10">No comments yet.</p>
                          ) : (
                            (asset.comments || []).map((c, i) => (
                              <div key={i} className={`p-2 rounded-lg text-xs ${c.author === 'ADMIN' ? 'bg-indigo-500/20 ml-4' : 'bg-white/5 mr-4'}`}>
                                <span className="text-[9px] text-muted-foreground uppercase block mb-1">{c.author}</span>
                                <p className="text-white/90">{c.text}</p>
                              </div>
                            ))
                          )}
                        </div>
                        <div className="flex gap-2 mt-auto">
                          <input type="text" value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => e.key === 'Enter' && addComment(asset)} placeholder="Type comment..." className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-500/50" />
                          <button onClick={() => addComment(asset)} className="bg-cyan-500 text-black px-2 py-1.5 rounded hover:bg-cyan-400"><Send className="w-3 h-3" /></button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}


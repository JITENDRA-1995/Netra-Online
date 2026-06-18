import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FolderOpen, UploadCloud, Trash2, Lock, DownloadCloud, File, MessageSquare, Send, X } from "lucide-react";
import { supabase } from "../../supabase/client";

export function ClientGlobalAssets({ client, setActiveClientTab }) {
  const [assets, setAssets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeCommentId, setActiveCommentId] = useState(null);
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    if (client) fetchAssets();
  }, [client]);

  const fetchAssets = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('client_assets').select('*').eq('client_id', client.id).order('created_at', { ascending: false });
    if (!error && data) {
      setAssets(data);
    } else {
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
    const fileName = `${client.id}_CLIENT_${Date.now()}.${fileExt}`;
    const filePath = `vault/${fileName}`;

    let publicUrl = "";
    const { error: uploadError } = await supabase.storage.from('client-assets').upload(filePath, file);
    if (uploadError) {
      publicUrl = URL.createObjectURL(file);
    } else {
      const { data: publicUrlData } = supabase.storage.from('client-assets').getPublicUrl(filePath);
      publicUrl = publicUrlData.publicUrl;
    }

    const newAsset = {
      client_id: client.id,
      name: file.name,
      file_url: publicUrl,
      file_type: file.type,
      size: file.size,
      is_locked: false,
      uploaded_by: 'CLIENT',
      comments: []
    };

    const { error: dbError } = await supabase.from('client_assets').insert([newAsset]);
    if (dbError) {
      const mockAssets = JSON.parse(localStorage.getItem(`netra_mock_assets_${client.id}`) || '[]');
      const assetWithId = { ...newAsset, id: Date.now().toString(), created_at: new Date().toISOString() };
      localStorage.setItem(`netra_mock_assets_${client.id}`, JSON.stringify([assetWithId, ...mockAssets]));
    }
    fetchAssets();
    setUploading(false);
  };

  const deleteAsset = async (asset) => {
    if (asset.uploaded_by !== 'CLIENT') {
      alert("You cannot delete an asset uploaded by the admin.");
      return;
    }
    if (!confirm("Delete your asset?")) return;
    
    const { error } = await supabase.from('client_assets').delete().eq('id', asset.id);
    if (error) {
       const mockAssets = JSON.parse(localStorage.getItem(`netra_mock_assets_${client.id}`) || '[]');
       const updated = mockAssets.filter(a => a.id !== asset.id);
       localStorage.setItem(`netra_mock_assets_${client.id}`, JSON.stringify(updated));
    }
    fetchAssets();
  };

  const addComment = async (asset) => {
    if (!commentText.trim()) return;
    const newComment = { text: commentText, author: 'CLIENT', created_at: new Date().toISOString() };
    const updatedComments = [...(asset.comments || []), newComment];
    
    const { error } = await supabase.from('client_assets').update({ comments: updatedComments }).eq('id', asset.id);
    if (error) {
       const mockAssets = JSON.parse(localStorage.getItem(`netra_mock_assets_${client.id}`) || '[]');
       const updated = mockAssets.map(a => a.id === asset.id ? { ...a, comments: updatedComments } : a);
       localStorage.setItem(`netra_mock_assets_${client.id}`, JSON.stringify(updated));
    }
    setCommentText("");
    fetchAssets();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2 tracking-widest uppercase">
            <FolderOpen className="w-5 h-5 text-indigo-400" />
            Global Asset Vault
          </h2>
          <p className="text-xs text-muted-foreground mt-1 tracking-wider">
            Securely share, view, and comment on project-independent files.
          </p>
        </div>
        <label className="flex items-center justify-center gap-2 bg-indigo-500/20 text-indigo-400 px-6 py-3 rounded-xl cursor-pointer hover:bg-indigo-500/30 transition-colors text-xs font-bold uppercase tracking-widest border border-indigo-500/20">
          <UploadCloud className="w-4 h-4" />
          {uploading ? "Uploading..." : "Drop New Asset"}
          <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      <div className="bg-[#0a0f1e]/40 border border-white/5 rounded-2xl p-6 min-h-[50vh]">
        {isLoading ? (
          <div className="text-center text-muted-foreground py-20 text-xs tracking-widest uppercase animate-pulse">Loading Vault...</div>
        ) : assets.length === 0 ? (
          <div className="text-center text-muted-foreground/30 py-32 flex flex-col items-center gap-4">
            <UploadCloud className="w-12 h-12 opacity-50" />
            <span className="text-xs uppercase tracking-widest">Vault is Empty. Drop files here to share with Netra.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assets.map(asset => (
              <div key={asset.id} className="border border-white/5 rounded-xl overflow-hidden bg-black/60 group flex flex-col relative h-72 hover:border-white/10 transition-colors">
                <div className="h-44 bg-black/50 border-b border-white/5 relative flex items-center justify-center overflow-hidden">
                  {asset.file_type?.startsWith('image/') ? (
                    <>
                      <img src={asset.file_url} className={`w-full h-full object-cover transition-all ${asset.is_locked ? 'opacity-20 blur-[2px] grayscale' : ''}`} alt={asset.name} />
                      {asset.is_locked && (
                        <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                          <Lock className="w-8 h-8 text-white/40 mb-2" />
                          <span className="text-white/40 font-black tracking-widest uppercase text-sm">PREVIEW ONLY</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <File className="w-12 h-12 text-white/10" />
                  )}
                </div>
                
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white truncate mb-1">{asset.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider flex justify-between">
                      <span>{(asset.size / 1024 / 1024).toFixed(2)} MB</span>
                      <span className={asset.uploaded_by === 'CLIENT' ? 'text-indigo-400' : 'text-cyan-400'}>{asset.uploaded_by === 'CLIENT' ? 'You' : 'Netra'}</span>
                    </p>
                  </div>
                  
                  <div className="flex justify-between items-center pt-3 mt-3 border-t border-white/5">
                    <button onClick={() => setActiveCommentId(activeCommentId === asset.id ? null : asset.id)} className="p-1.5 bg-cyan-500/10 text-cyan-400 rounded hover:bg-cyan-500/20 relative flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                      <MessageSquare className="w-3.5 h-3.5" /> Discuss
                      {asset.comments?.length > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 border border-black bg-cyan-500 rounded-full"></span>}
                    </button>
                    <div className="flex gap-2">
                      {!asset.is_locked && (
                        <a href={asset.file_url} target="_blank" rel="noreferrer" className="p-1.5 bg-white/5 text-white/60 rounded hover:bg-white/10">
                          <DownloadCloud className="w-4 h-4" />
                        </a>
                      )}
                      {asset.uploaded_by === 'CLIENT' && (
                        <button onClick={() => deleteAsset(asset)} className="p-1.5 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {activeCommentId === asset.id && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute inset-0 bg-black/95 flex flex-col p-4 z-10 backdrop-blur-xl">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-xs uppercase tracking-widest text-cyan-400 font-bold">Asset Discussion</h4>
                        <button onClick={() => setActiveCommentId(null)} className="text-muted-foreground hover:text-white"><X className="w-4 h-4" /></button>
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-2 scrollbar-thin">
                        {(asset.comments || []).length === 0 ? (
                          <p className="text-[10px] text-muted-foreground uppercase text-center mt-12">No discussion yet.</p>
                        ) : (
                          (asset.comments || []).map((c, i) => (
                            <div key={i} className={`p-3 rounded-xl text-xs ${c.author === 'CLIENT' ? 'bg-indigo-500/20 ml-6 border border-indigo-500/10' : 'bg-white/5 mr-6'}`}>
                              <span className="text-[9px] text-muted-foreground uppercase block mb-1.5">{c.author === 'CLIENT' ? 'You' : 'Netra'}</span>
                              <p className="text-white/90 leading-relaxed">{c.text}</p>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="flex gap-2 mt-auto">
                        <input type="text" value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => e.key === 'Enter' && addComment(asset)} placeholder="Write a message..." className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500/50" />
                        <button onClick={() => addComment(asset)} className="bg-indigo-500 text-white px-3 py-2 rounded-lg hover:bg-indigo-400"><Send className="w-3.5 h-3.5" /></button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

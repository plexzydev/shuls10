import { useState, useEffect, useRef } from 'react';
import { Film, ChevronUp, ChevronDown, Plus, Trash2, ExternalLink } from 'lucide-react';
import gsap from 'gsap';
import { API_URL } from '../App';

let clipsAnimated = false;

export default function Clips({ user, token }) {
  const [clips, setClips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const pageRef = useRef(null);

  useEffect(() => { fetchClips(); }, []);

  useEffect(() => {
    if (!pageRef.current || loading || clipsAnimated) return;
    clipsAnimated = true;
    const ctx = gsap.context(() => {
      gsap.fromTo('.gsap-cl-card', { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, ease: 'power2.out' });
    }, pageRef);
    return () => ctx.revert();
  }, [loading]);

  async function fetchClips() {
    try {
      const res = await fetch(`${API_URL}/api/clips`);
      if (res.ok) { const d = await res.json(); setClips(d.clips); }
    } catch (e) {}
    setLoading(false);
  }

  async function submitClip(e) {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/clips`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), url: url.trim() })
      });
      if (res.ok) { setTitle(''); setUrl(''); setShowForm(false); fetchClips(); }
    } catch (e) {}
    setSubmitting(false);
  }

  async function voteClip(id, value) {
    try {
      await fetch(`${API_URL}/api/clips/${id}/vote`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ value })
      });
      fetchClips();
    } catch (e) {}
  }

  async function deleteClip(id) {
    if (!confirm('¿Eliminar este clip?')) return;
    try {
      await fetch(`${API_URL}/api/clips/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      fetchClips();
    } catch (e) {}
  }

  function getUserVote(clip) {
    if (!user?.id || !clip.clipVotes) return 0;
    const v = clip.clipVotes.find(v => v.userId === user.id);
    return v ? v.value : 0;
  }

  return (
    <div ref={pageRef} className="max-w-3xl mx-auto px-4 py-8">
      <div className="gsap-cl-header mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center">
              <Film size={24} className="text-brand" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-black text-foreground">Clips</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Los mejores momentos del canal</p>
            </div>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-brand/10 text-brand border border-brand/20 text-sm font-bold hover:bg-brand/20 transition-all">
            <Plus size={16} /> Subir Clip
          </button>
        </div>
        {showForm && (
          <form onSubmit={submitClip} className="mt-6 p-5 bg-card border border-brand/15 rounded-3xl space-y-4">
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Título del clip" maxLength={100}
              className="w-full px-4 py-3 rounded-xl bg-popover border border-brand/10 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-brand/30" />
            <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="URL del clip (kick.com, youtube, etc.)"
              className="w-full px-4 py-3 rounded-xl bg-popover border border-brand/10 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-brand/30" />
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 rounded-full text-sm font-bold text-muted-foreground hover:text-foreground">Cancelar</button>
              <button type="submit" disabled={submitting || !title.trim() || !url.trim()}
                className="px-6 py-2 rounded-full bg-brand text-black text-sm font-bold hover:bg-brand-light transition-all disabled:opacity-50">
                {submitting ? 'Subiendo...' : 'Publicar'}
              </button>
            </div>
          </form>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : clips.length === 0 ? (
        <div className="text-center py-16 bg-card border border-brand/10 rounded-3xl">
          <Film size={28} className="text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-foreground text-sm font-bold">No hay clips todavía</p>
          <p className="text-muted-foreground text-xs mt-1">Sé el primero en subir un clip del canal</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {clips.map(clip => {
            const myVote = getUserVote(clip);
            return (
              <div key={clip.id} className="gsap-cl-card bg-card border border-brand/10 rounded-2xl p-4 hover:border-brand/20 transition-all duration-200 group">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center gap-0 bg-popover rounded-xl p-1 border border-brand/5">
                    <button onClick={() => voteClip(clip.id, 1)}
                      className={`p-1.5 rounded-lg transition-all ${myVote === 1 ? 'text-brand bg-brand/10' : 'text-muted-foreground hover:text-brand hover:bg-brand/5'}`}>
                      <ChevronUp size={20} strokeWidth={2.5} />
                    </button>
                    <span className={`text-sm font-bold min-w-[24px] text-center ${clip.votes > 0 ? 'text-brand' : clip.votes < 0 ? 'text-red-400' : 'text-foreground'}`}>
                      {clip.votes}
                    </span>
                    <button onClick={() => voteClip(clip.id, -1)}
                      className={`p-1.5 rounded-lg transition-all ${myVote === -1 ? 'text-red-400 bg-red-500/10' : 'text-muted-foreground hover:text-red-400 hover:bg-red-500/5'}`}>
                      <ChevronDown size={20} strokeWidth={2.5} />
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-foreground truncate">{clip.title}</h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs font-medium text-muted-foreground">por {clip.user?.displayName || clip.user?.kickUsername}</span>
                      <span className="text-xs text-muted-foreground/40">&bull;</span>
                      <span className="text-xs text-muted-foreground/80">{new Date(clip.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a href={clip.url} target="_blank" rel="noopener noreferrer"
                      className="p-3 rounded-xl bg-brand/5 text-brand hover:bg-brand hover:text-black transition-all">
                      <ExternalLink size={16} />
                    </a>
                    {(user?.id === clip.userId || ['broadcaster', 'moderator'].includes(user?.kickRole)) && (
                      <button onClick={() => deleteClip(clip.id)}
                        className="p-3 rounded-xl hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  User, 
  Tag, 
  ArrowRight, 
  Link as LinkIcon, 
  ShoppingCart, 
  Download, 
  PhoneCall, 
  Home as HomeIcon, 
  Briefcase 
} from 'lucide-react';
import { BLOG_POSTS, BlogPost } from '../data/blogData';

interface BlogDetailsProps {
  slug: string;
  onPageChange: (page: string) => void;
}

export default function BlogDetails({ slug, onPageChange }: BlogDetailsProps) {
  const [allPosts, setAllPosts] = React.useState<BlogPost[]>(BLOG_POSTS);

  React.useEffect(() => {
    fetch('/api/blogs')
      .then(res => res.json())
      .then((data: any[]) => {
        if (Array.isArray(data)) {
          const mapped: BlogPost[] = data.map(dbBlog => {
            const calculatedSlug = dbBlog.slug || dbBlog.id || dbBlog.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            return {
              slug: calculatedSlug,
              title: dbBlog.title,
              excerpt: dbBlog.excerpt,
              content: dbBlog.content,
              author: dbBlog.author || 'Suryatech Admin',
              image: dbBlog.image || 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800',
              date: dbBlog.date || new Date().toISOString().split('T')[0],
              updatedDate: dbBlog.updatedDate || dbBlog.date || new Date().toISOString().split('T')[0],
              readTime: dbBlog.readTime || '5 min read',
              category: (dbBlog.category as any) || 'Tutorials',
              metaTitle: dbBlog.metaTitle || dbBlog.title,
              metaDescription: dbBlog.metaDescription || dbBlog.excerpt,
              tags: dbBlog.tags || ['Updates'],
              relatedSlugs: dbBlog.relatedSlugs || [],
              relatedProductSlug: dbBlog.relatedProductSlug
            };
          });

          const merged = [...BLOG_POSTS];
          mapped.forEach(item => {
            if (!merged.some(m => m.slug === item.slug || m.title.toLowerCase() === item.title.toLowerCase())) {
              merged.unshift(item);
            }
          });
          setAllPosts(merged);
        }
      })
      .catch(err => console.error("Error fetching dynamic blog details:", err));
  }, []);

  // Find current blog post
  const post = useMemo(() => {
    return allPosts.find((p) => p.slug === slug);
  }, [slug, allPosts]);

  // Find related articles
  const relatedPosts = useMemo(() => {
    if (!post) return [];
    return allPosts.filter((p) => post.relatedSlugs.includes(p.slug));
  }, [post, allPosts]);

  const handleBackToBlog = () => {
    onPageChange('blog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRelatedClick = (relatedSlug: string) => {
    onPageChange(`blog-details:${relatedSlug}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Custom Parser for Markdown content to generate premium Tailwind styled blocks
  const renderParsedContent = (contentString: string) => {
    const lines = contentString.split('\n');
    const elements: React.JSX.Element[] = [];
    let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null;
    let currentTable: string[][] | null = null;

    const flushList = (key: number) => {
      if (currentList) {
        const TagElement = currentList.type;
        elements.push(
          <TagElement key={`list-${key}`} className={`my-6 pl-6 space-y-2 text-left ${currentList.type === 'ul' ? 'list-disc' : 'list-decimal'}`}>
            {currentList.items.map((item, idx) => {
              const parts = item.split('**');
              return (
                <li key={idx} className="text-slate-300 text-xs sm:text-sm leading-relaxed marker:text-blue-500">
                  {parts.map((part, pIdx) => {
                    if (pIdx % 2 === 1) {
                      return <strong key={pIdx} className="text-white font-extrabold">{part}</strong>;
                    }
                    return part;
                  })}
                </li>
              );
            })}
          </TagElement>
        );
        currentList = null;
      }
    };

    const flushTable = (key: number) => {
      if (currentTable) {
        const headerRow = currentTable[0];
        const dataRows = currentTable.slice(1);
        elements.push(
          <div key={`table-wrapper-${key}`} className="overflow-x-auto my-8 border border-slate-800 rounded-lg shadow-xl">
            <table className="min-w-full divide-y divide-slate-800 text-left font-sans text-xs sm:text-sm">
              <thead className="bg-slate-900/90 text-white uppercase font-black tracking-widest text-[10px]">
                <tr>
                  {headerRow.map((cell, idx) => (
                    <th key={idx} className="px-6 py-4 border-b border-slate-800 text-blue-400">{cell}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 bg-slate-900/30">
                {dataRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-800/20 transition-colors">
                    {row.map((cell, idx) => (
                      <td key={idx} className="px-6 py-4 text-slate-300 font-medium">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        currentTable = null;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // 1. Handle Table rows
      if (trimmed.startsWith('|')) {
        flushList(i);
        if (trimmed.includes('---')) continue; // Skip table border divisions
        const cells = trimmed.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        if (!currentTable) currentTable = [];
        currentTable.push(cells);
        continue;
      } else {
        flushTable(i);
      }

      // 2. Handle Unordered List lines
      if (trimmed.startsWith('-')) {
        const itemText = trimmed.replace(/^-\s*/, '');
        if (!currentList || currentList.type !== 'ul') {
          flushList(i);
          currentList = { type: 'ul', items: [] };
        }
        currentList.items.push(itemText);
        continue;
      }

      // 3. Handle Ordered List lines
      if (/^\d+\./.test(trimmed)) {
        const itemText = trimmed.replace(/^\d+\.\s*/, '');
        if (!currentList || currentList.type !== 'ol') {
          flushList(i);
          currentList = { type: 'ol', items: [] };
        }
        currentList.items.push(itemText);
        continue;
      }

      // Flush lists if non-list line matches
      flushList(i);

      if (!trimmed) continue;

      // 4. Handle Headers
      if (trimmed.startsWith('###')) {
        elements.push(
          <h3 key={i} className="text-base sm:text-lg font-black uppercase text-white tracking-tight mt-8 mb-4 border-l-4 border-blue-500 pl-3.5 text-left">
            {trimmed.replace(/^###\s*/, '')}
          </h3>
        );
      } else if (trimmed.startsWith('##')) {
        elements.push(
          <h2 key={i} className="text-lg sm:text-xl font-black uppercase text-white tracking-tight mt-10 mb-6 border-b border-slate-800 pb-3 text-left">
            {trimmed.replace(/^##\s*/, '')}
          </h2>
        );
      } else if (trimmed.startsWith('#')) {
        elements.push(
          <h1 key={i} className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight mt-12 mb-8 text-left">
            {trimmed.replace(/^#\s*/, '')}
          </h1>
        );
      } else {
        // 5. Normal text paragraphs with inline strong tagging
        const parts = trimmed.split('**');
        elements.push(
          <p key={i} className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-5 text-left font-normal">
            {parts.map((part, pIdx) => {
              if (pIdx % 2 === 1) {
                return <strong key={pIdx} className="text-white font-extrabold">{part}</strong>;
              }
              return part;
            })}
          </p>
        );
      }
    }

    // Flush remaining
    flushList(lines.length);
    flushTable(lines.length);

    return elements;
  };

  if (!post) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-white py-24 px-4 text-center space-y-6">
        <h1 className="text-2xl font-bold font-mono">Article Not Found</h1>
        <p className="text-slate-400">The requested blog post could not be resolved.</p>
        <button
          onClick={handleBackToBlog}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 font-extrabold uppercase rounded text-xs transition-all"
        >
          Back to Blog List
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-white pt-8 pb-16 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumbs / Back Trigger */}
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={handleBackToBlog}
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400 hover:text-white transition-colors cursor-pointer"
            id="back-to-blog-btn"
          >
            <ArrowLeft className="w-4 h-4 text-blue-500" />
            <span>Back to Blogs</span>
          </button>
          
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-slate-500 font-bold uppercase">
            <span>Home</span>
            <span>/</span>
            <span>Blog</span>
            <span>/</span>
            <span className="text-blue-500 max-w-[200px] truncate">{post.title}</span>
          </div>
        </div>

        {/* Blog Article Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Main Article Column */}
          <article className="lg:col-span-8 space-y-8 bg-slate-900/30 border border-slate-900 p-6 sm:p-8 rounded-2xl shadow-xl">
            
            {/* Header Content */}
            <div className="space-y-4 text-left">
              <span className="bg-blue-600/15 border border-blue-500/20 text-blue-400 text-[10px] font-black font-mono px-3.5 py-1 uppercase tracking-wider rounded-sm inline-block">
                {post.category}
              </span>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white uppercase tracking-tight leading-tight">
                {post.title}
              </h1>

              {/* Author and Date Meta Info */}
              <div className="flex flex-wrap items-center gap-y-2 gap-x-6 pt-2 border-b border-slate-800 pb-6 text-xs text-slate-400 font-mono font-bold uppercase">
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-500" />
                  <span>By {post.author}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span>Published: {post.date}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span>{post.readTime}</span>
                </span>
              </div>
            </div>

            {/* Featured Image */}
            <div className="relative h-64 sm:h-[400px] bg-slate-950 rounded-xl overflow-hidden shadow-2xl">
              <img
                src={post.image}
                alt={post.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Content Body */}
            <div className="prose prose-invert max-w-none text-left" id="blog-content-container">
              {renderParsedContent(post.content)}
            </div>

            {/* Article Footer & Tags */}
            <div className="pt-8 border-t border-slate-800/80 space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-left">
                <span className="text-slate-500 text-xs font-mono font-black uppercase tracking-wider inline-flex items-center gap-1 mr-2">
                  <Tag className="w-3.5 h-3.5" /> Tags:
                </span>
                {post.tags.map((tag) => (
                  <span 
                    key={tag}
                    className="bg-[#1E293B] border border-slate-800 text-slate-300 text-[10px] font-mono font-black px-2.5 py-1 rounded-sm uppercase tracking-wide"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {post.updatedDate && post.updatedDate !== post.date && (
                <p className="text-[10px] font-mono text-slate-500 italic text-left">
                  Last updated: {post.updatedDate}
                </p>
              )}
            </div>

            {/* Support Back Button */}
            <div className="flex justify-start pt-4">
              <button
                onClick={handleBackToBlog}
                className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-black uppercase tracking-wider rounded-sm transition-all border border-slate-800 inline-flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-blue-500" />
                <span>Back to Blogs</span>
              </button>
            </div>
          </article>

          {/* Sidebar / Navigation & Marketing Links */}
          <div className="lg:col-span-4 space-y-8 text-left">
            
            {/* Quick Internal Links Card */}
            <div className="bg-slate-900/40 border border-slate-800/60 p-6 rounded-2xl shadow-lg space-y-6">
              <h3 className="text-xs font-black font-mono text-slate-500 uppercase tracking-widest border-b border-slate-850 pb-3">
                // Internal Navigation
              </h3>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => { onPageChange('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="w-full py-3 px-4 bg-slate-950/40 hover:bg-slate-900 border border-slate-850 rounded-lg text-xs font-black uppercase tracking-wider text-slate-300 hover:text-white flex items-center gap-3 transition-colors cursor-pointer"
                >
                  <HomeIcon className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>Suryatech Homepage</span>
                </button>
                
                <button
                  onClick={() => { onPageChange('pricing'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="w-full py-3 px-4 bg-slate-950/40 hover:bg-slate-900 border border-slate-850 rounded-lg text-xs font-black uppercase tracking-wider text-slate-300 hover:text-white flex items-center gap-3 transition-colors cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>View Software Store</span>
                </button>

                <button
                  onClick={() => { onPageChange('downloads'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="w-full py-3 px-4 bg-slate-950/40 hover:bg-slate-900 border border-slate-850 rounded-lg text-xs font-black uppercase tracking-wider text-slate-300 hover:text-white flex items-center gap-3 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>Download Free Trials</span>
                </button>

                <button
                  onClick={() => { onPageChange('contact'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="w-full py-3 px-4 bg-slate-950/40 hover:bg-slate-900 border border-slate-850 rounded-lg text-xs font-black uppercase tracking-wider text-slate-300 hover:text-white flex items-center gap-3 transition-colors cursor-pointer"
                >
                  <PhoneCall className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>Request Live Demo</span>
                </button>
              </div>
            </div>

            {/* Related Products Ad Section */}
            {post.relatedProductSlug && (
              <div className="bg-[#1E293B]/40 border border-[#2563EB]/20 p-6 rounded-2xl shadow-lg space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full blur-2xl pointer-events-none" />
                
                <span className="bg-[#2563EB]/10 border border-[#2563EB]/20 text-blue-400 text-[9px] font-black font-mono px-2 py-0.5 uppercase tracking-widest rounded">
                  Recommended System
                </span>

                <h3 className="text-base font-black uppercase tracking-tight text-white">
                  Need {post.category === 'POS Software' ? 'Supermarket POS Software?' : 'Robust GST Billing?'}
                </h3>

                <p className="text-slate-400 text-xs leading-relaxed">
                  Join over 14,000+ happy Indian retailers. Get automated backups, GSTR-1 Excel reports, barcode scanning, and lifetime keys for just ₹3,000.
                </p>

                <button
                  onClick={() => {
                    const mappedPage = post.relatedProductSlug === 'supermarket_pos' 
                      ? 'software-details:supermarket_pos' 
                      : post.relatedProductSlug === 'enterprise_erp'
                      ? 'software-details:enterprise_erp'
                      : 'software-details:retail_billing';
                    onPageChange(mappedPage);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-lg shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Explore Software</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Related Articles list */}
            {relatedPosts.length > 0 && (
              <div className="bg-slate-900/40 border border-slate-800/60 p-6 rounded-2xl shadow-lg space-y-6">
                <h3 className="text-xs font-black font-mono text-slate-500 uppercase tracking-widest border-b border-slate-850 pb-3">
                  // Related Articles
                </h3>

                <div className="space-y-4">
                  {relatedPosts.map((rPost) => (
                    <div 
                      key={rPost.slug}
                      onClick={() => handleRelatedClick(rPost.slug)}
                      className="group cursor-pointer block border-b border-slate-850 pb-4 last:border-0 last:pb-0"
                    >
                      <span className="text-[9px] font-black font-mono text-blue-500 uppercase tracking-wider block mb-1">
                        {rPost.category}
                      </span>
                      <h4 className="text-xs sm:text-sm font-black text-slate-350 group-hover:text-blue-400 transition-colors uppercase leading-snug">
                        {rPost.title}
                      </h4>
                      <p className="text-slate-500 text-[11px] leading-relaxed mt-1 line-clamp-2">
                        {rPost.excerpt}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Search, Calendar, Clock, ArrowRight, BookOpen, Tag } from 'lucide-react';
import { BLOG_POSTS, BLOG_CATEGORIES, BlogPost } from '../data/blogData';

interface BlogListProps {
  onPageChange: (page: string) => void;
}

export default function BlogList({ onPageChange }: BlogListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [allPosts, setAllPosts] = useState<BlogPost[]>(BLOG_POSTS);

  React.useEffect(() => {
    fetch('/api/blogs')
      .then(res => res.json())
      .then((data: any[]) => {
        if (Array.isArray(data)) {
          const mapped: BlogPost[] = data.map(dbBlog => {
            const slug = dbBlog.slug || dbBlog.id || dbBlog.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            return {
              slug,
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
              merged.unshift(item); // Prepend new admin blogs at the top!
            }
          });
          setAllPosts(merged);
        }
      })
      .catch(err => console.error("Error fetching dynamic blogs:", err));
  }, []);

  // Filter posts based on search query and selected category
  const filteredPosts = useMemo(() => {
    return allPosts.filter((post) => {
      const matchesSearch =
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === 'All' || post.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory, allPosts]);

  // Featured article (always first in standard display, or custom featured flag)
  const featuredPost = useMemo(() => {
    return allPosts[0] || BLOG_POSTS[0]; // Let first post be featured
  }, [allPosts]);

  // Latest articles (excluding the featured one, if category is 'All')
  const latestPosts = useMemo(() => {
    if (selectedCategory !== 'All' || searchQuery !== '') {
      return filteredPosts;
    }
    return filteredPosts.slice(1); // Exclude featured post from secondary grid
  }, [filteredPosts, selectedCategory, searchQuery]);

  const handlePostClick = (slug: string) => {
    onPageChange(`blog-details:${slug}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white pt-8 pb-16 font-sans">
      {/* Hero Banner Section */}
      <div className="relative overflow-hidden bg-slate-950/60 border-b border-slate-800 py-16 sm:py-24">
        {/* Decorative Grid Patterns */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-black tracking-widest uppercase">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Suryatech Knowledge Hub</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight uppercase leading-none">
            BSP <span className="text-[#2563EB]">Suryatech</span> Blog
          </h1>
          
          <p className="max-w-2xl mx-auto text-slate-400 text-sm sm:text-base leading-relaxed">
            Expert insights, hardware installation manuals, GST tax compliance updates, and strategies to supercharge checkout speed and retail business operations in India.
          </p>

          {/* Search Box */}
          <div className="max-w-xl mx-auto relative mt-8" id="blog-search-container">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 h-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search guides, tutorials, or HSN updates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-4 bg-slate-900/90 border border-slate-800 rounded-lg text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-inner text-white"
              id="blog-search-input"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Categories Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12" id="blog-category-filter">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-4 py-2 rounded-sm text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              selectedCategory === 'All'
                ? 'bg-blue-600 text-white shadow-[2px_2px_0px_#1e3a8a]'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            All Articles
          </button>
          {BLOG_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-sm text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-[2px_2px_0px_#1e3a8a]'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Featured Post (Only displayed when on 'All' category and no search query) */}
        {selectedCategory === 'All' && searchQuery === '' && featuredPost && (
          <div className="mb-16" id="featured-blog-section">
            <h2 className="text-xs font-black font-mono text-slate-500 uppercase tracking-widest mb-4">// Featured Article</h2>
            <div 
              onClick={() => handlePostClick(featuredPost.slug)}
              className="group bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl hover:border-blue-600/40 transition-all cursor-pointer grid grid-cols-1 lg:grid-cols-12 gap-0"
            >
              {/* Image Container */}
              <div className="lg:col-span-7 h-64 sm:h-96 relative overflow-hidden bg-slate-950">
                <img
                  src={featuredPost.image}
                  alt={featuredPost.title}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-blue-600 text-white text-[10px] font-black font-mono px-3 py-1 uppercase tracking-wider rounded">
                    {featuredPost.category}
                  </span>
                </div>
              </div>

              {/* Content Container */}
              <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-4 text-left">
                  <div className="flex items-center gap-4 text-xs font-mono font-bold text-slate-400 uppercase">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      {featuredPost.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      {featuredPost.readTime}
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-black uppercase tracking-tight leading-tight text-white group-hover:text-blue-400 transition-colors">
                    {featuredPost.title}
                  </h3>

                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                    {featuredPost.excerpt}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
                  <span className="text-xs font-mono font-extrabold text-slate-500">
                    By {featuredPost.author}
                  </span>
                  
                  <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-blue-400 group-hover:translate-x-1 transition-transform">
                    <span>Read More</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Latest / Filtered Posts Grid */}
        <div>
          <h2 className="text-xs font-black font-mono text-slate-500 uppercase tracking-widest mb-6" id="latest-articles-heading">
            {selectedCategory !== 'All' || searchQuery !== '' 
              ? `// Search Results (${filteredPosts.length})` 
              : '// Latest Articles'
            }
          </h2>

          {filteredPosts.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/50 border border-slate-800/80 rounded-xl space-y-4">
              <p className="text-slate-400 text-sm">No articles found matching your criteria.</p>
              <button 
                onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-xs font-bold uppercase rounded"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8" id="blog-grid-layout">
              {latestPosts.map((post) => (
                <article
                  key={post.slug}
                  onClick={() => handlePostClick(post.slug)}
                  className="group bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg hover:border-blue-600/40 hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between"
                  id={`blog-card-${post.slug}`}
                >
                  <div className="space-y-4">
                    {/* Thumbnail Image */}
                    <div className="h-48 sm:h-52 relative overflow-hidden bg-slate-950">
                      <img
                        src={post.image}
                        alt={post.title}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="bg-[#1E293B] border border-slate-750 text-slate-300 text-[9px] font-black font-mono px-2 py-0.5 uppercase tracking-wider rounded">
                          {post.category}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 sm:p-6 space-y-3 text-left">
                      <div className="flex items-center gap-3 text-[10px] font-mono font-bold text-slate-400 uppercase">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-blue-500" />
                          {post.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-blue-500" />
                          {post.readTime}
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-black uppercase tracking-tight leading-snug text-white group-hover:text-blue-400 transition-colors">
                        {post.title}
                      </h3>

                      <p className="text-slate-400 text-xs sm:text-sm leading-relaxed line-clamp-3">
                        {post.excerpt}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] font-mono font-extrabold text-slate-500 truncate">
                      By {post.author.split(',')[0]}
                    </span>
                    
                    <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-blue-400 group-hover:text-blue-300">
                      <span>Read More</span>
                      <ArrowRight className="w-3.5 h-3.5 shrink-0 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

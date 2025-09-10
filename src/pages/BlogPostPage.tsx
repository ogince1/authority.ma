import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Tag,
  Share2,
  Facebook,
  Twitter,
  Linkedin
} from 'lucide-react';
import { motion } from 'framer-motion';
import { BlogPost } from '../types';
import { getBlogPostBySlug } from '../lib/supabase';
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';
import SEOHead from '../components/SEO/SEOHead';
import MarkdownRenderer from '../components/Blog/MarkdownRenderer';

const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = React.useState<BlogPost | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;
      
      setLoading(true);
      try {
        const postData = await getBlogPostBySlug(slug);
        setPost(postData);
      } catch (error) {
        console.error('Error fetching blog post:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = post?.title || '';

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded-lg mb-6"></div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Article non trouvé
            </h1>
            <p className="text-gray-600 mb-8">
              L'article que vous recherchez n'existe pas ou n'est plus disponible.
            </p>
            <Link
              to="/blog"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Retour au blog
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead
        title={post.meta_title || `${post.title} | Blog GoHaya`}
        description={post.meta_description || post.excerpt}
        image={post.featured_image}
        url={`https://gohaya.com/blog/${post.slug}`}
        type="article"
      />
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          to="/blog"
          className="inline-flex items-center text-emerald-600 hover:text-emerald-700 mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour au blog
        </Link>

        <article>
          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
              <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                {post.category}
              </span>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                <span>{formatDate(post.published_at || post.created_at)}</span>
              </div>
              <div className="flex items-center">
                <User className="h-4 w-4 mr-1" />
                <span>GoHaya</span>
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {post.title}
            </h1>

            <p className="text-xl text-gray-600 leading-relaxed">
              {post.excerpt}
            </p>
          </motion.header>

          {/* Featured Image */}
          {post.featured_image && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-8"
            >
              <img
                src={post.featured_image}
                alt={post.title}
                className="w-full h-64 md:h-96 object-cover rounded-lg shadow-lg"
              />
            </motion.div>
          )}

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="prose prose-lg max-w-none mb-8"
          >
            <MarkdownRenderer content={post.content} />
          </motion.div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mb-8"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium"
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Share */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="border-t pt-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Share2 className="h-5 w-5 text-gray-600" />
                <span className="text-gray-600 font-medium">Partager cet article</span>
              </div>
              <div className="flex items-center space-x-3">
                <a
                  href={shareLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Facebook className="h-4 w-4" />
                </a>
                <a
                  href={shareLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors"
                >
                  <Twitter className="h-4 w-4" />
                </a>
                <a
                  href={shareLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
              </div>
            </div>
          </motion.div>
        </article>
      </main>

      <Footer />
    </div>
  );
};

export default BlogPostPage;
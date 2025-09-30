import React from 'react';
import { useParams } from 'react-router-dom';
import { getBlogPostById } from '../../lib/supabase';
import { BlogPost } from '../../types';
import BlogForm from './BlogForm';

const BlogFormWrapper: React.FC<{ isEdit?: boolean }> = ({ isEdit = false }) => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = React.useState<BlogPost | null>(null);
  const [loading, setLoading] = React.useState(isEdit);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isEdit && id) {
      const fetchPost = async () => {
        try {
          setLoading(true);
          const postData = await getBlogPostById(id);
          if (postData) {
            setPost(postData);
          } else {
            setError('Article non trouvé');
          }
        } catch (err) {
          console.error('Error fetching blog post:', err);
          setError('Erreur lors du chargement de l\'article');
        } finally {
          setLoading(false);
        }
      };

      fetchPost();
    }
  }, [isEdit, id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de l'article...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">❌</div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return <BlogForm post={post || undefined} isEdit={isEdit} />;
};

export default BlogFormWrapper;
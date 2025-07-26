import React from 'react';
import { useParams } from 'react-router-dom';
import { getProjectById } from '../../lib/supabase';
import { Project } from '../../types';
import ProjectForm from './ProjectForm';

const ProjectFormWrapper: React.FC<{ isEdit?: boolean }> = ({ isEdit = false }) => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = React.useState<Project | null>(null);
  const [loading, setLoading] = React.useState(isEdit);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isEdit && id) {
      const fetchProject = async () => {
        try {
          setLoading(true);
          const projectData = await getProjectById(id);
          if (projectData) {
            setProject(projectData);
          } else {
            setError('Projet non trouvé');
          }
        } catch (err) {
          console.error('Error fetching project:', err);
          setError('Erreur lors du chargement du projet');
        } finally {
          setLoading(false);
        }
      };

      fetchProject();
    }
  }, [isEdit, id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du projet...</p>
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

  return <ProjectForm project={project || undefined} isEdit={isEdit} />;
};

export default ProjectFormWrapper;
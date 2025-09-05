import React from 'react';
import { Users, Target, Award, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';
import SEOHead from '../components/SEO/SEOHead';

const AboutPage: React.FC = () => {
  const values = [
    {
      icon: Target,
      title: 'Innovation',
      description: 'Nous soutenons l\'innovation et l\'entrepreneuriat au Maroc en facilitant l\'accès aux projets digitaux.'
    },
    {
      icon: Users,
      title: 'Communauté',
      description: 'Nous créons une communauté d\'entrepreneurs et d\'investisseurs pour favoriser les échanges.'
    },
    {
      icon: Award,
      title: 'Excellence',
      description: 'Nous nous engageons à maintenir la plus haute qualité dans tous nos projets référencés.'
    },
    {
      icon: Globe,
      title: 'Impact',
      description: 'Notre objectif est de contribuer à la transformation digitale du Maroc.'
    }
  ];

  const stats = [
    { value: '2024', label: 'Année de création' },
    { value: '50+', label: 'Projets référencés' },
    { value: '200+', label: 'Entrepreneurs connectés' },
    { value: '85%', label: 'Taux de satisfaction' }
  ];

  const team = [
    {
      name: 'Ahmed Benjelloun',
      role: 'Fondateur & CEO',
      image: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg',
      description: 'Expert en développement web avec 10 ans d\'expérience dans l\'écosystème startup marocain.'
    },
    {
      name: 'Fatima Alaoui',
      role: 'Directrice Technique',
      image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
      description: 'Ingénieure passionnée par les nouvelles technologies et l\'innovation digitale.'
    },
    {
      name: 'Youssef Chraibi',
      role: 'Responsable Business',
      image: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg',
      description: 'Spécialiste en développement commercial avec une forte expertise du marché marocain.'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <SEOHead 
        title="À Propos | GoHaya - Plateforme Marketplace Projets Digitaux"
        description="Découvrez l'histoire et la mission de GoHaya, la plateforme innovante dédiée à l'achat et à la vente de projets digitaux exceptionnels."
      />
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-teal-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Notre Mission
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Faciliter l'accès à l'entrepreneuriat digital en créant 
              une plateforme innovante dédiée à l'achat et à la vente de projets 
              technologiques exceptionnels.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                GoHaya en Chiffres
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  Fondée en 2024, GoHaya est née de la vision d'entrepreneurs 
                  passionnés qui ont constaté le besoin d'une plateforme dédiée à 
                  l'écosystème des projets digitaux innovants.
                </p>
                <p>
                  Face à la difficulté de trouver des projets digitaux de qualité 
                  ou d'acquérir des MVP validés, nous avons créé cette marketplace 
                  pour connecter vendeurs et acheteurs de projets technologiques.
                </p>
                <p>
                  Aujourd'hui, nous sommes fiers d'accompagner des dizaines 
                  d'entrepreneurs dans leurs projets d'acquisition et de cession, 
                  contribuant ainsi au dynamisme de l'écosystème digital mondial.
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <img
                src="https://images.pexels.com/photos/3184306/pexels-photo-3184306.jpeg"
                alt="Équipe GoHaya"
                className="rounded-lg shadow-lg w-full h-80 object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Nos Valeurs
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Les principes qui guident notre action au quotidien pour créer 
              la meilleure expérience pour notre communauté d'entrepreneurs.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="bg-white rounded-lg p-6 text-center shadow-sm"
              >
                <div className="bg-blue-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <value.icon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {value.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              nextstrat.ma en Chiffres
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Les résultats de notre engagement envers l'écosystème entrepreneurial.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl font-bold text-blue-600 mb-2">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Notre Équipe
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Une équipe passionnée et expérimentée, dédiée au succès de vos projets.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="bg-white rounded-lg overflow-hidden shadow-sm"
              >
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-64 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    {member.name}
                  </h3>
                  <p className="text-blue-600 font-medium mb-3">{member.role}</p>
                  <p className="text-gray-600 text-sm">{member.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-teal-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              Rejoignez Notre Communauté
            </h2>
            <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
              Que vous soyez acheteur ou vendeur, découvrez comment GoHaya 
              peut vous accompagner dans vos projets digitaux.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/contact"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors"
              >
                Nous Contacter
              </a>
              <a
                href="/mvp"
                className="bg-transparent text-white px-8 py-3 rounded-lg font-medium border-2 border-white hover:bg-white hover:text-blue-600 transition-colors"
              >
                Explorer les Projets
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutPage;
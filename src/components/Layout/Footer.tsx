import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-500 mr-0.5">
                  G
                </div>
                <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-blue-400 mr-0.5">
                  o
                </div>
                <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-500 mr-0.5">
                  H
                </div>
                <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-blue-400 mr-0.5">
                  a
                </div>
                <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-500 mr-0.5">
                  y
                </div>
                <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-blue-400">
                  a
                </div>
              </div>
            </div>
            <p className="text-gray-300 text-sm">
              La plateforme innovante pour découvrir et acquérir des projets digitaux 
              exceptionnels. Accélérez votre croissance avec GoHaya.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Navigation</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-gray-300 hover:text-white transition-colors">
                  Accueil
                </Link>
              </li>
              <li>
                <Link to="/mvp" className="text-gray-300 hover:text-white transition-colors">
                  MVP & Startups
                </Link>
              </li>
              <li>
                <Link to="/vendre" className="text-gray-300 hover:text-white transition-colors">
                  Vendre un Projet
                </Link>
              </li>
              <li>
                <Link to="/success-stories" className="text-gray-300 hover:text-white transition-colors">
                  Success Stories
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Explorer</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-gray-300 hover:text-white transition-colors">
                  Tous les Projets
                </Link>
              </li>
              <li>
                <Link to="/mvp" className="text-gray-300 hover:text-white transition-colors">
                  MVP
                </Link>
              </li>
              <li>
                <Link to="/startups" className="text-gray-300 hover:text-white transition-colors">
                  Startups
                </Link>
              </li>
              <li>
                <Link to="/websites" className="text-gray-300 hover:text-white transition-colors">
                  Sites Web
                </Link>
              </li>
              <li>
                <Link to="/investir" className="text-gray-300 hover:text-white transition-colors">
                  Investir
                </Link>
              </li>
              <li>
                <Link to="/lever-des-fonds" className="text-gray-300 hover:text-white transition-colors">
                  Lever des Fonds
                </Link>
              </li>
              <li>
                <Link to="/vendre" className="text-gray-300 hover:text-white transition-colors">
                  Vendre un Projet
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-gray-300 hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Secteurs d'Activité */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Secteurs</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/mvp?sector=saas" className="text-gray-300 hover:text-white transition-colors">
                  SaaS
                </Link>
              </li>
              <li>
                <Link to="/mvp?sector=ecommerce" className="text-gray-300 hover:text-white transition-colors">
                  E-commerce
                </Link>
              </li>
              <li>
                <Link to="/mvp?sector=fintech" className="text-gray-300 hover:text-white transition-colors">
                  Fintech
                </Link>
              </li>
              <li>
                <Link to="/mvp?sector=edtech" className="text-gray-300 hover:text-white transition-colors">
                  EdTech
                </Link>
              </li>
              <li>
                <Link to="/mvp?sector=healthtech" className="text-gray-300 hover:text-white transition-colors">
                  HealthTech
                </Link>
              </li>
              <li>
                <Link to="/mvp?sector=mobile" className="text-gray-300 hover:text-white transition-colors">
                  Applications Mobiles
                </Link>
              </li>
              <li>
                <Link to="/mvp?sector=ai" className="text-gray-300 hover:text-white transition-colors">
                  Intelligence Artificielle
                </Link>
              </li>
              <li>
                <Link to="/mvp?sector=blockchain" className="text-gray-300 hover:text-white transition-colors">
                  Blockchain
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm">
                <Mail className="h-4 w-4 text-blue-400" />
                <span className="text-gray-300">contact@gohaya.com</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Phone className="h-4 w-4 text-blue-400" />
                <span className="text-gray-300">+212 6 00 00 00 00</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <MapPin className="h-4 w-4 text-blue-400" />
                <span className="text-gray-300">Casablanca, Maroc</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 GoHaya. Tous droits réservés.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link to="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">
                Politique de Confidentialité
              </Link>
              <Link to="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">
                Conditions d'Utilisation
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './FaqPage.css';

function IconCreation() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
      <rect x="2.75" y="1.75" width="14.5" height="18.5" rx="2.25" stroke="#F0EDE6" strokeWidth="1.5"/>
      <path d="M6.5 7h7M6.5 11h5" stroke="#F0EDE6" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="19.5" cy="19.5" r="4.75" stroke="#F0EDE6" strokeWidth="1.5"/>
      <path d="M23.5 23.5L25.5 25.5" stroke="#F0EDE6" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function IconDelivery() {
  return (
    <svg width="26" height="18" viewBox="0 0 26 18" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="15" height="11" rx="1.5" stroke="#F0EDE6" strokeWidth="1.5"/>
      <path d="M16 4.5h4.5L24 9v5h-8V4.5z" stroke="#F0EDE6" strokeWidth="1.5" strokeLinejoin="round"/>
      <circle cx="6" cy="15" r="2" stroke="#F0EDE6" strokeWidth="1.5"/>
      <circle cx="20" cy="15" r="2" stroke="#F0EDE6" strokeWidth="1.5"/>
    </svg>
  );
}

function IconChevronUp() {
  return (
    <svg width="17" height="9" viewBox="0 0 17 9" fill="none" aria-hidden="true">
      <path d="M1 8L8.5 1L16 8" stroke="#F0EDE6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconChevronDown() {
  return (
    <svg width="17" height="9" viewBox="0 0 17 9" fill="none" aria-hidden="true">
      <path d="M1 1L8.5 8L16 1" stroke="#F0EDE6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconHeadset() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 14v-3a8 8 0 0116 0v3" stroke="#12121A" strokeWidth="1.5" strokeLinecap="round"/>
      <rect x="1" y="13" width="4" height="7" rx="2" stroke="#12121A" strokeWidth="1.5"/>
      <rect x="19" y="13" width="4" height="7" rx="2" stroke="#12121A" strokeWidth="1.5"/>
      <path d="M23 20v1a4 4 0 01-4 4h-3" stroke="#12121A" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

const FAQ_DATA = [
  {
    id: 'creation',
    category: 'Création & personnalisation',
    icon: 'creation',
    questions: [
      {
        id: 'q1',
        question: 'Quels formats audio sont acceptés ?',
        answer: "Echoras accepte les formats audio les plus courants : MP3, WAV, OGG, FLAC et M4A. Pour garantir une meilleure précision de génération, il est recommandé d'importer un fichier de bonne qualité.",
      },
      {
        id: 'q2',
        question: 'Puis-je modifier la sculpture après la génération ?',
        answer: "Oui, vous pouvez ajuster tous les paramètres de personnalisation à tout moment avant de passer commande. Vos créations sont sauvegardées comme brouillons dans votre espace personnel.",
      },
    ],
  },
  {
    id: 'commande',
    category: 'Commande & livraison',
    icon: 'delivery',
    questions: [
      {
        id: 'q3',
        question: 'Comment suivre ma commande ?',
        answer: 'Vous pouvez suivre votre commande depuis votre espace personnel, dans la section "Mes commandes". Un e-mail vous sera également envoyé à chaque changement de statut.',
      },
    ],
  },
];

function AccordionItem({ question, answer, isOpen, onToggle }) {
  return (
    <div className={`faq__item${isOpen ? ' faq__item--open' : ''}`}>
      <button
        className="faq__question"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span>{question}</span>
        {isOpen ? <IconChevronUp /> : <IconChevronDown />}
      </button>
      {isOpen && (
        <div className="faq__answer">
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function FaqPage() {
  const [openItems, setOpenItems] = useState({ q1: true });

  function toggle(id) {
    setOpenItems(prev => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="faq-page">
      <section className="faq-page__header">
        <div className="faq-page__header-content">
          <h1 className="faq-page__title">Questions fréquentes</h1>
          <p className="faq-page__subtitle">
            De l'import audio à la livraison, cette page rassemble les informations essentielles pour mieux comprendre l'expérience Echoras.
          </p>
        </div>
      </section>

      <div className="faq-page__sections">
        {FAQ_DATA.map(section => (
          <div key={section.id} className="faq-page__section">
            <div className="faq-page__section-header">
              {section.icon === 'creation' ? <IconCreation /> : <IconDelivery />}
              <h2 className="faq-page__section-title">{section.category}</h2>
            </div>
            <div className="faq-page__questions">
              {section.questions.map(item => (
                <AccordionItem
                  key={item.id}
                  question={item.question}
                  answer={item.answer}
                  isOpen={!!openItems[item.id]}
                  onToggle={() => toggle(item.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="faq-page__contact">
        <div className="faq-page__contact-text">
          <h2 className="faq-page__contact-title">Besoin d'aide complémentaire ?</h2>
          <p className="faq-page__contact-desc">
            Si vous ne trouvez pas la réponse à votre question, l'équipe Echoras peut vous accompagner dans la création, la commande ou le suivi de votre sculpture.
          </p>
        </div>
        <Link to="/contact" className="faq-page__contact-btn">
          <IconHeadset />
          <span>Contacter le support</span>
        </Link>
      </div>
    </div>
  );
}

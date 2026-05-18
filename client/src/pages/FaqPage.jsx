import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './FaqPage.css';

function IconPricing() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
      <circle cx="13" cy="13" r="11.25" stroke="#F0EDE6" strokeWidth="1.5"/>
      <path d="M13 7v1.5M13 17.5V19M10 11.5c0-1.38 1.34-2.5 3-2.5s3 1.12 3 2.5c0 1.38-1.34 2.5-3 2.5S10 13.88 10 15.5c0 1.38 1.34 2.5 3 2.5s3-1.12 3-2.5" stroke="#F0EDE6" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function IconAccount() {
  return (
    <svg width="24" height="26" viewBox="0 0 24 26" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="5.25" stroke="#F0EDE6" strokeWidth="1.5"/>
      <path d="M2 24c0-5.52 4.48-10 10-10s10 4.48 10 10" stroke="#F0EDE6" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function IconPrivacy() {
  return (
    <svg width="24" height="26" viewBox="0 0 24 26" fill="none" aria-hidden="true">
      <path d="M12 2L3 6v7c0 5.25 3.9 10.15 9 11.35C17.1 23.15 21 18.25 21 13V6L12 2z" stroke="#F0EDE6" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M8.5 13l2.5 2.5 4.5-4.5" stroke="#F0EDE6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

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
        question: "Quelle est la taille maximale d'un fichier audio ?",
        answer: "La taille maximale acceptée est de 50 Mo par fichier. Cette limite couvre largement la plupart des fichiers musicaux, même en haute qualité.",
      },
      {
        id: 'q3',
        question: 'Puis-je modifier la sculpture après la génération ?',
        answer: "Oui, vous pouvez ajuster les 8 paramètres de personnalisation à tout moment avant de passer commande : hauteur des pics, lissage, rayon, hauteur du cylindre, épaisseur, segments, tours d'hélice et largeur du ruban. La sculpture se met à jour en temps réel.",
      },
      {
        id: 'q4',
        question: "Puis-je graver le nom d'un artiste ou un titre sur le socle ?",
        answer: "Oui. Dans le studio 3D, la section « Gravure sur socle » vous permet de renseigner un nom d'artiste et un titre de chanson. Ces informations sont gravées en creux directement sur la base de la sculpture, incluses dans le fichier d'impression.",
      },
      {
        id: 'q5',
        question: 'Puis-je sauvegarder ma création sans passer commande ?',
        answer: "Oui. Une fois connecté, le bouton « Sauvegarder ma sculpture » enregistre votre création en brouillon dans votre espace personnel. Vous pouvez la retrouver, la modifier et la commander plus tard depuis la page « Mes créations ».",
      },
    ],
  },
  {
    id: 'tarifs',
    category: 'Tarifs & matériaux',
    icon: 'pricing',
    questions: [
      {
        id: 'q6',
        question: 'Quelles finitions et couleurs sont disponibles ?',
        answer: "Deux finitions sont proposées : PLA mat (12 coloris du blanc cassé au bordeaux en passant par le vert sauge ou le bleu marine) et PETG brillant (12 coloris dont argent, or, violet et rose fuchsia). La finition et la couleur sont sélectionnables directement dans le configurateur.",
      },
      {
        id: 'q7',
        question: 'Comment est calculé le prix de ma sculpture ?',
        answer: "Le prix est calculé en temps réel à partir du volume réel de votre sculpture (hélice + cylindre + socle), de la densité du matériau choisi, du coût matière au kilogramme, de l'amortissement de la machine d'impression et des frais fixes de fabrication et d'emballage. Le détail s'affiche dans le studio avant toute commande.",
      },
    ],
  },
  {
    id: 'commande',
    category: 'Commande & livraison',
    icon: 'delivery',
    questions: [
      {
        id: 'q8',
        question: "Quelles sont les étapes d'une commande ?",
        answer: "Une fois votre sculpture configurée, ajoutez-la au panier, renseignez votre adresse de livraison et validez. Votre commande passe ensuite par les statuts suivants : Reçue → En fabrication → Expédiée → Livrée. Vous pouvez suivre l'avancement à tout moment depuis « Mes commandes ».",
      },
      {
        id: 'q9',
        question: 'Comment suivre ma commande ?',
        answer: 'Connectez-vous et rendez-vous dans « Mes commandes » pour consulter le statut en temps réel de chaque commande. Un e-mail vous est envoyé automatiquement à chaque changement de statut.',
      },
    ],
  },
  {
    id: 'compte',
    category: 'Compte & espace personnel',
    icon: 'account',
    questions: [
      {
        id: 'q10',
        question: 'Faut-il un compte pour créer une sculpture ?',
        answer: "Non. Le configurateur 3D est accessible sans inscription : vous pouvez importer un fichier audio, personnaliser la sculpture et voir l'estimation de prix librement. Un compte est uniquement nécessaire pour sauvegarder une création ou passer commande.",
      },
      {
        id: 'q11',
        question: 'Comment réinitialiser mon mot de passe ?',
        answer: "Sur la page de connexion, cliquez sur « Mot de passe oublié » et renseignez votre adresse e-mail. Vous recevrez un lien de réinitialisation valable 1 heure. Si vous ne recevez pas l'e-mail, vérifiez vos spams.",
      },
      {
        id: 'q12',
        question: 'Puis-je supprimer mon compte ?',
        answer: "Oui. Depuis votre page profil, une option vous permet de supprimer définitivement votre compte ainsi que toutes les données associées (sculptures, historique de commandes, adresses). Cette action est irréversible.",
      },
    ],
  },
  {
    id: 'confidentialite',
    category: 'Données & confidentialité',
    icon: 'privacy',
    questions: [
      {
        id: 'q13',
        question: 'Mes fichiers audio sont-ils conservés ?',
        answer: "Non. Vos fichiers audio sont utilisés uniquement pour générer la sculpture et ne sont pas stockés durablement sur nos serveurs. Conformément au RGPD, aucune donnée audio n'est conservée au-delà de la livraison de votre commande.",
      },
      {
        id: 'q14',
        question: 'Mes données bancaires sont-elles stockées ?',
        answer: "Non. Echoras ne stocke aucune donnée bancaire. Le paiement est entièrement géré par un prestataire certifié PCI DSS. Vos informations de carte ne transitent jamais par nos serveurs.",
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
              {section.icon === 'creation'  && <IconCreation />}
              {section.icon === 'delivery'  && <IconDelivery />}
              {section.icon === 'pricing'   && <IconPricing />}
              {section.icon === 'account'   && <IconAccount />}
              {section.icon === 'privacy'   && <IconPrivacy />}
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

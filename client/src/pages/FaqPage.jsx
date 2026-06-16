import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './FaqPage.css';
import IconCreationPerso from '../assets/icon-livraison.svg?react';
import IconLivraison from '../assets/icon-contacts.svg?react';
import IconTarif from '../assets/icon-creation-perso.svg?react';
import IconProfil from '../assets/icon-personnalisez.svg?react'
import IconDonnees from '../assets/icon-paiement.svg?react';
import IconSupportContact from '../assets/icon-profil.svg?react';

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
  return <IconSupportContact width="24" height="24" fill="#12121A" aria-hidden="true" />;
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
              {section.icon === 'creation'  && <IconCreationPerso width="26" height="26" fill="#F0EDE6" aria-hidden="true" />}
              {section.icon === 'delivery'  && <IconLivraison     width="26" height="26" fill="#F0EDE6" aria-hidden="true" />}
              {section.icon === 'pricing'   && <IconTarif         width="26" height="26" fill="#F0EDE6" aria-hidden="true" />}
              {section.icon === 'account'   && <IconProfil        width="26" height="26" fill="#F0EDE6" aria-hidden="true" />}
              {section.icon === 'privacy'   && <IconDonnees       width="26" height="26" fill="#F0EDE6" aria-hidden="true" />}
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

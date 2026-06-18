import { useState, useEffect } from 'react';

/**
 * Hook personnalisé qui décode un fichier audio côté client via la Web Audio API
 * et en extrait un tableau d'amplitudes sous-échantillonné, prêt à alimenter
 * la génération de la géométrie 3D.
 *
 * Tout le traitement se fait dans le navigateur : aucun fichier audio n'est
 * envoyé au serveur pour cette étape, ce qui respecte notre politique RGPD
 * (pas de stockage de données audio au-delà de la livraison).
 *
 * @param {File|null} file - le fichier audio sélectionné par l'utilisateur
 * @returns {{ waveformData: Float32Array|null, isAnalyzing: boolean }}
 */
export function useAudioAnalysis(file) {
  const [waveformData, setWaveformData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (!file) return;

    // "cancelled" est un drapeau de nettoyage propre au cycle de vie React.
    // Si l'utilisateur change de fichier pendant l'analyse (ou démonte le composant),
    // React exécute la fonction de retour du useEffect avant de relancer l'effet.
    // Sans ce drapeau, setWaveformData serait appelé sur un composant déjà démonté,
    // ce qui provoque un warning React et peut causer des fuites mémoire.
    let cancelled = false;

    // Les navigateurs limitent le nombre d'AudioContext simultanés (environ 6 sur Chrome).
    // Chaque AudioContext réserve un accès matériel à la carte son.
    // On utilise la syntaxe window.webkitAudioContext comme fallback pour la compatibilité Safari.
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    async function analyze() {
      setIsAnalyzing(true);

      try {
        // file.arrayBuffer() lit le fichier en mémoire sous forme binaire brute (ArrayBuffer).
        // decodeAudioData prend ce binaire et le décode dans un format PCM (Pulse-Code Modulation),
        // c'est-à-dire une suite d'échantillons d'amplitude à virgule flottante.
        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

        // Un fichier stéréo contient deux canaux (0 = gauche, 1 = droite).
        // On prend uniquement le canal gauche : pour une waveform visuelle, un seul
        // canal est suffisant et évite un calcul de moyenne inutile.
        const raw = audioBuffer.getChannelData(0);

        // Sous-échantillonnage à 2048 points.
        // Un fichier audio à 44 100 Hz dure en moyenne 3 à 5 minutes, soit
        // entre 7 et 13 millions d'échantillons. Les passer tous à Three.js serait
        // trop lourd pour la géométrie. 2048 correspond exactement au nombre de segments
        // configuré dans buildHelixRibbonGeometry : chaque point du tableau devient
        // un anneau de la sculpture.
        const targetLength = 2048;
        const blockSize = Math.floor(raw.length / targetLength);
        const downsampled = new Float32Array(targetLength);

        for (let i = 0; i < targetLength; i++) {
          const start = i * blockSize;
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            // Math.abs() car les échantillons PCM sont signés (entre -1 et +1).
            // Ce qui nous intéresse pour la sculpture est l'amplitude (hauteur de crête),
            // pas la polarité du signal. On calcule ainsi une énergie moyenne par bloc,
            // similaire à une valeur RMS simplifiée.
            sum += Math.abs(raw[start + j]);
          }
          downsampled[i] = sum / blockSize;
        }

        // Normalisation dans l'intervalle [0, 1].
        // L'amplitude brute dépend du volume de l'enregistrement (un fichier fort
        // aura des valeurs proches de 1, un fichier faible proche de 0.1).
        // En divisant par le maximum, la sculpture a toujours la même hauteur maximale
        // quelle que soit la dynamique du fichier. Le slider peakHeight contrôle ensuite
        // l'échelle en Three.js.
        let max = 0;
        for (let i = 0; i < downsampled.length; i++) {
          if (downsampled[i] > max) max = downsampled[i];
        }
        if (max > 0) {
          for (let i = 0; i < downsampled.length; i++) {
            downsampled[i] /= max;
          }
        }

        if (!cancelled) {
          setWaveformData(downsampled);
        }
      } catch (err) {
        console.error('Audio analysis failed:', err);
      } finally {
        if (!cancelled) setIsAnalyzing(false);
      }
    }

    analyze();

    // Fonction de nettoyage exécutée par React quand le fichier change ou que
    // le composant se démonte. On ferme l'AudioContext pour libérer le slot matériel
    // et on lève le drapeau cancelled pour ignorer tout setState encore en vol.
    return () => {
      cancelled = true;
      audioCtx.close();
    };
  }, [file]);

  return { waveformData, isAnalyzing };
}

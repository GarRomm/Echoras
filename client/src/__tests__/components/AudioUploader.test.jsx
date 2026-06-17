import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import AudioUploader from '../../components/AudioUploader';

vi.mock('../../components/AudioUploader.css', () => ({}));

function makeFile(name, sizeBytes = 1000, type = 'audio/mpeg') {
  return new File([new Uint8Array(sizeBytes)], name, { type });
}

function getFileInput() {
  return document.querySelector('input[type="file"]');
}

describe('AudioUploader — idle state', () => {
  it('renders the drop zone label', () => {
    render(<AudioUploader onFileSelected={vi.fn()} isAnalyzing={false} audioFile={null} />);
    expect(screen.getByText(/Glissez un fichier ici/)).toBeInTheDocument();
  });

  it('renders accepted format hint', () => {
    render(<AudioUploader onFileSelected={vi.fn()} isAnalyzing={false} audioFile={null} />);
    expect(screen.getByText(/MP3, WAV, OGG, FLAC, M4A/)).toBeInTheDocument();
  });

  it('shows "Analyse en cours" when isAnalyzing is true', () => {
    render(<AudioUploader onFileSelected={vi.fn()} isAnalyzing={true} audioFile={null} />);
    expect(screen.getByText(/Analyse en cours/)).toBeInTheDocument();
  });

  it('does not show an error initially', () => {
    render(<AudioUploader onFileSelected={vi.fn()} isAnalyzing={false} audioFile={null} />);
    expect(screen.queryByRole('paragraph', { name: /Format|trop lourd/ })).toBeNull();
  });
});

describe('AudioUploader — file selected state', () => {
  it('displays the selected file name', () => {
    const file = makeFile('chanson.mp3');
    render(<AudioUploader onFileSelected={vi.fn()} isAnalyzing={false} audioFile={file} />);
    expect(screen.getByText('chanson.mp3')).toBeInTheDocument();
  });

  it('shows a clear button when a file is loaded', () => {
    const file = makeFile('chanson.mp3');
    render(<AudioUploader onFileSelected={vi.fn()} isAnalyzing={false} audioFile={file} />);
    expect(screen.getByText('✕')).toBeInTheDocument();
  });

  it('calls onFileSelected(null) when clear button is clicked', () => {
    const onFileSelected = vi.fn();
    const file = makeFile('chanson.mp3');
    render(<AudioUploader onFileSelected={onFileSelected} isAnalyzing={false} audioFile={file} />);
    fireEvent.click(screen.getByText('✕'));
    expect(onFileSelected).toHaveBeenCalledWith(null);
  });
});

describe('AudioUploader — validation via input', () => {
  it('calls onFileSelected with the file for a valid .mp3', () => {
    const onFileSelected = vi.fn();
    render(<AudioUploader onFileSelected={onFileSelected} isAnalyzing={false} audioFile={null} />);
    fireEvent.change(getFileInput(), { target: { files: [makeFile('track.mp3')] } });
    expect(onFileSelected).toHaveBeenCalledWith(expect.any(File));
  });

  it('calls onFileSelected for all accepted extensions', () => {
    const extensions = ['wav', 'ogg', 'flac', 'm4a'];
    for (const ext of extensions) {
      const onFileSelected = vi.fn();
      const { unmount } = render(
        <AudioUploader onFileSelected={onFileSelected} isAnalyzing={false} audioFile={null} />,
      );
      // Use the last rendered input to avoid stale DOM refs from previous iterations
      const inputs = document.querySelectorAll('input[type="file"]');
      const input = inputs[inputs.length - 1];
      fireEvent.change(input, { target: { files: [makeFile(`track.${ext}`)] } });
      expect(onFileSelected).toHaveBeenCalled();
      unmount();
    }
  });

  it('shows an error and does NOT call onFileSelected for .mp4', () => {
    const onFileSelected = vi.fn();
    render(<AudioUploader onFileSelected={onFileSelected} isAnalyzing={false} audioFile={null} />);
    fireEvent.change(getFileInput(), { target: { files: [makeFile('video.mp4')] } });
    expect(screen.getByText(/Format non supporté/)).toBeInTheDocument();
    expect(onFileSelected).not.toHaveBeenCalled();
  });

  it('shows an error for files exceeding 50 MB', () => {
    const onFileSelected = vi.fn();
    render(<AudioUploader onFileSelected={onFileSelected} isAnalyzing={false} audioFile={null} />);
    const bigFile = makeFile('huge.mp3', 51 * 1024 * 1024);
    fireEvent.change(getFileInput(), { target: { files: [bigFile] } });
    expect(screen.getByText(/Fichier trop lourd/)).toBeInTheDocument();
    expect(onFileSelected).not.toHaveBeenCalled();
  });

  it('does nothing when no file is in the event', () => {
    const onFileSelected = vi.fn();
    render(<AudioUploader onFileSelected={onFileSelected} isAnalyzing={false} audioFile={null} />);
    fireEvent.change(getFileInput(), { target: { files: [] } });
    expect(onFileSelected).not.toHaveBeenCalled();
  });
});

describe('AudioUploader — drag and drop', () => {
  it('calls onFileSelected on a valid drop', () => {
    const onFileSelected = vi.fn();
    render(<AudioUploader onFileSelected={onFileSelected} isAnalyzing={false} audioFile={null} />);
    const dropZone = screen.getByText(/Glissez un fichier ici/).closest('div');
    fireEvent.drop(dropZone, { dataTransfer: { files: [makeFile('track.wav')] } });
    expect(onFileSelected).toHaveBeenCalled();
  });

  it('shows an error on drop of an unsupported format', () => {
    const onFileSelected = vi.fn();
    render(<AudioUploader onFileSelected={onFileSelected} isAnalyzing={false} audioFile={null} />);
    const dropZone = screen.getByText(/Glissez un fichier ici/).closest('div');
    fireEvent.drop(dropZone, { dataTransfer: { files: [makeFile('image.png')] } });
    expect(screen.getByText(/Format non supporté/)).toBeInTheDocument();
    expect(onFileSelected).not.toHaveBeenCalled();
  });
});

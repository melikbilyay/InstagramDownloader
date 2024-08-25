'use client'
import { useState, useEffect } from 'react';
import styles from './Home.module.css';

export default function Home() {
    const [url, setUrl] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [progress, setProgress] = useState<number>(0);
    const [intervalId, setIntervalId] = useState<number | undefined>(undefined);

    useEffect(() => {
        // Temizlik işlemleri
        return () => {
            if (intervalId !== undefined) {
                clearInterval(intervalId);
            }
        };
    }, [intervalId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setProgress(0);
        setLoading(true);

        // İlerleme animasyonu başlat
        const id = window.setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    window.clearInterval(id);
                    return 100;
                }
                return prev + 25;
            });
        }, 1000);

        setIntervalId(id);

        try {
            const response = await fetch(`/api/instagram?url=${encodeURIComponent(url)}`);
            const data = await response.json();

            if (response.ok) {
                const videoUrl = data.url_list[0];

                // Video dosyasını indir
                const videoResponse = await fetch(videoUrl);

                if (!videoResponse.ok) {
                    throw new Error('Failed to fetch video');
                }

                const contentLength = videoResponse.headers.get('content-length');
                if (!contentLength) {
                    throw new Error('Failed to get content length');
                }

                // Null kontrolü
                if (videoResponse.body === null) {
                    throw new Error('Video response body is null');
                }

                const reader = videoResponse.body.getReader();
                const contentLengthInt = parseInt(contentLength, 10);
                let receivedLength = 0;
                const chunks: Uint8Array[] = []; // Tür belirleme

                // İlerleme okuma işlemini başlat
                const processText = async ({ done, value }: { done: boolean; value?: Uint8Array }): Promise<void> => {
                    if (done) {
                        clearInterval(id); // İlerleme animasyonunu durdur
                        const videoBlob = new Blob(chunks);
                        const videoBlobUrl = URL.createObjectURL(videoBlob);
                        const a = document.createElement('a');
                        a.href = videoBlobUrl;
                        a.download = 'video.mp4';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(videoBlobUrl);
                        setProgress(100);
                        setLoading(false);
                        return;
                    }

                    if (value) {
                        chunks.push(value);
                        receivedLength += value.length;
                        setProgress((receivedLength / contentLengthInt) * 100);
                    }

                    return reader.read().then(processText);
                };

                return reader.read().then(processText);
            } else {
                throw new Error(data.error || 'An error occurred');
            }
        } catch (error) {
            console.error('Error occurred:', error);
            setError((error as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Instagram Video Downloader</h1>
            <form onSubmit={handleSubmit} className={styles.form}>
                <label className={styles.label}>
                    Instagram Video URL:
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        required
                        className={styles.input}
                    />
                </label>
                <button type="submit" className={styles.button}>Get Download Link</button>
            </form>

            {loading && (
                <div className={styles.progressContainer}>
                    <div className={styles.progressBar} style={{ width: `${progress}%` }}>
                        <span className={styles.progressText}>{Math.round(progress)}%</span>
                    </div>
                </div>
            )}

            {error && <p className={styles.error}>{error}</p>}
        </div>
    );
}

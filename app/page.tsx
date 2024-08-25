'use client'
import { useState, useEffect } from 'react';
import styles from './Home.module.css';

export default function Home() {
    const [url, setUrl] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [intervalId, setIntervalId] = useState(null);

    useEffect(() => {
        // Temizlik işlemleri
        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [intervalId]);

    const handleSubmit = async (e:any) => {
        e.preventDefault();
        setError('');
        setProgress(0);
        setLoading(true);

        // İlerleme animasyonu başlat
        const id = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(id);
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

                const reader = videoResponse.body.getReader();
                const contentLengthInt = parseInt(contentLength, 10);
                let receivedLength = 0;
                const chunks = [];

                reader.read().then(function processText({ done, value }) {
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

                    chunks.push(value);
                    receivedLength += value.length;
                    setProgress((receivedLength / contentLengthInt) * 100);
                    return reader.read().then(processText);
                });
            } else {
                throw new Error(data.error || 'An error occurred');
            }
        } catch (error) {
            console.error('Error occurred:', error);
            setError(error.message);
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

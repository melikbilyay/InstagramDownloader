import instagramGetUrl from 'instagram-url-direct';

export async function GET(request) {
    const url = new URL(request.url);
    const videoUrl = url.searchParams.get('url');

    if (!videoUrl) {
        console.error('URL is required');
        return new Response(JSON.stringify({ error: 'URL is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const links = await instagramGetUrl(videoUrl);
        console.log('Links fetched successfully:', links);
        return new Response(JSON.stringify(links), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error fetching video URL:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch video URL' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

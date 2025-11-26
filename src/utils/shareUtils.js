import LZString from 'lz-string';

export const generateShareLink = (data) => {
    if (!data) return null;
    const json = JSON.stringify(data);
    const compressed = LZString.compressToEncodedURIComponent(json);
    const url = `${window.location.origin}${window.location.pathname}?data=${compressed}`;
    return url;
};

export const getSharedData = () => {
    const params = new URLSearchParams(window.location.search);
    const compressed = params.get('data');
    if (!compressed) return null;

    try {
        const json = LZString.decompressFromEncodedURIComponent(compressed);
        if (!json) return null;
        return JSON.parse(json);
    } catch (e) {
        console.error("Failed to parse shared data", e);
        return null;
    }
};

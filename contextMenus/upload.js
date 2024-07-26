chrome.runtime.onInstalled.addListener((details) => {
    chrome.contextMenus.create({
        "id": "Zipline_Upload_Image",
        "title": "Upload Image to Zipline",
        "contexts": ["image"]
    });

    chrome.contextMenus.create({
        "id": "Zipline_Upload_Video",
        "title": "Upload Video to Zipline",
        "contexts": ["video"]
    });

    chrome.contextMenus.create({
        "id": "Zipline_Upload_Audio",
        "title": "Upload Audio to Ziline",
        "contexts": ["audio"]
    });

    chrome.contextMenus.create({
        "id": "Zipline_Upload_Text",
        "title": "Upload Text to Zipline",
        "contexts": ["selection"]
    });

    chrome.contextMenus.create({
        "id": "Zipline_Shorten_URL",
        "title": "Shorten URL with Zipline",
        "contexts": ["link"]
    });
});

chrome.contextMenus.onClicked.addListener(async (info) => {

    switch (info.menuItemId) {
        case "Zipline_Upload_Image":

            await uploadToZipline('upload', info.srcUrl)
            break;
        case "Zipline_Upload_Video":

            await uploadToZipline('upload', info.srcUrl)
            break;
        case "Zipline_Upload_Audio":

            await uploadToZipline('upload', info.srcUrl)
            break;
        case "Zipline_Upload_Text":

            await uploadToZipline('text', info.selectionText)
            break;
        case "Zipline_Shorten_URL":

            await uploadToZipline('shorten', info.linkUrl)
            break;
    }
});

async function uploadToZipline(type, url) {
    console.log(type, url)
    
    const { key: ziplineUrl } = await chrome.storage.local.get(['ziplineUrl'])
    const { key: ziplinToken } = await chrome.storage.local.get(['ziplineToken'])
    const { key: fileNameFormat } = await chrome.storage.local.get(['ziplineFileNameFormat'])
    const { key: imageCompression } = await chrome.storage.local.get(['ziplineImageCompression'])
    const { key: overrideDomain } = await chrome.storage.local.get(['ziplineOverrideDomain'])
    const { key: zeroWidthSpaces } = await chrome.storage.local.get(['ziplineZeroWidthSpaces'])
    const { key: noJSON } = await chrome.storage.local.get(['ziplineNoJSON'])
    const { key: embed } = await chrome.storage.local.get(['ziplineEmbed'])
    const { key: originalName } = await chrome.storage.local.get(['ziplineOriginalName'])

    switch (type) {
        case 'upload': {
            const base64Data = url.split(',')[1]
            const string = atob(base64Data)
            const bytes = new Uint8Array(len);

            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            const blob = new Blob([bytes], { type: 'image/png' });

            const file = new File([blob], 'image.png', { type: 'image/png' });

            const formData = new FormData();
            formData.append('file', file);
            break;
        }

        case 'text': {
            const blob = new Blob(['url'], {
                type: "text/plain"
            })

            const file = new File([blob], 'nome.txt', {
                type: "text/plain"
            })

            const formData = new FormData();
            formData.append('file', file);
            
            break;
        }

        case 'shorten': {

            await fetch()

            break;
        }
    }
}

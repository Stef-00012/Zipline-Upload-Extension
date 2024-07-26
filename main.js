chrome.runtime.onInstalled.addListener(async ({ reason }) => {
    if (reason === "install") {
        await chrome.storage.local.set({
            ziplineUrl: 'UNSET',
            ziplineToken: 'UNSET',
            ziplineFileNameFormat: 'RANDOM',
            ziplineImageCompression: '0',
            ziplineOverrideDomain: '',
            ziplineZeroWidthSpaces: 'no',
            ziplineNoJSON: 'no',
            ziplineEmbed: 'yes',
            ziplineOriginalName: 'no'
        })
    }
})

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
    
    const {
        ziplineUrl,
        ziplinToken,
        ziplineFileNameFormat: fileNameFormat,
        ziplineImageCompression: imageCompression,
        ziplineOverrideDomain: overrideDomain,
        ziplineZeroWidthSpaces: zeroWidthSpaces,
        ziplineNoJSON: noJSON,
        ziplineEmbed: embed,
        ziplineOriginalName: originalName
    } = await chrome.storage.local.get([
        'ziplineUrl',
        'ziplineToken',
        'ziplineFileNameFormat',
        'ziplineImageCompression',
        'ziplineOverrideDomain',
        'ziplineZeroWidthSpaces',
        'ziplineNoJSON',
        'ziplineEmbed',
        'ziplineOriginalName'
    ])

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

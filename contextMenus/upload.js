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

chrome.contextMenus.onClicked.addListener(async (info, tab) => {

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
    switch (type) {
        case 'upload': {
            
            break;
        }

        case 'text': {

            break;
        }

        case 'shorten': {

            break;
        }
    }
}
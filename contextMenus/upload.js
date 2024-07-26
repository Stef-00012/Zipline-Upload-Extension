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

chrome.contextMenus.onClicked.addListener((info, tab) => {
    // let application = "com.getsharex.sharex";

    switch (info.menuItemId) {
        case "Zipline_Upload_Image":
            // chrome.runtime.sendNativeMessage(application, {
            //     Action: "UploadImage",
            //     URL: info.srcUrl
            // });
            break;
        case "Zipline_Upload_Video":
            // chrome.runtime.sendNativeMessage(application, {
            //     Action: "UploadVideo",
            //     URL: info.srcUrl
            // });
            break;
        case "Zipline_Upload_Audio":
            // chrome.runtime.sendNativeMessage(application, {
            //     Action: "UploadAudio",
            //     URL: info.srcUrl
            // });
            break;
        case "Zipline_Upload_Text":
            // chrome.runtime.sendNativeMessage(application, {
            //     Action: "UploadText",
            //     Text: info.selectionText
            // });
            break;
        case "Zipline_Shorten_URL":
            // chrome.runtime.sendNativeMessage(application, {
            //     Action: "ShortenURL",
            //     URL: info.linkUrl
            // });
            break;
    }
});


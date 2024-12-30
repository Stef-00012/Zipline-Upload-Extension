# Installation

## Webstore

> [!WARNING]
> Updates will take longer to appear on the Chrome Webstore because they need to be reviewed.

To install the extension from the Chrome Webstore, open the [extension's Webstore page](https://chromewebstore.google.com/detail/zipline-upload/nckdinonilcnlmjipgggnejkpdldjmjn) and press "Add to chrome"

## Releases

On every update of the extension there will be a new release.
To download the extensions from the releases, go to the [latest release](https://github.com/stef-00012/Zipline-Upload-Extension/releases/latest) and download the `ziplineUploads.crx` file.

Once downloaded go to the extensions page (`chrome://extensions`) and drop there the file you just downloaded.

## Source

To install the extension from source, first clone this repository
```sh
git clone https://github.com/Stef-00012/Zipline-Upload-Extension
```
then go to the extensions page (`chrome://extensions`), enable "Developer mode" (top right), press the button "Load unpacked" (top left) and select the `src` folder located inside the folder you cloned earlier.

Once installed go to the extensions menu (top left puzzle icon) and press on zipline to setup your zipline host URL, token and preferences.

To upload images, video etc. just right click the media and you'll see "Upload ... to Zipline" or "Shorten URL with Zipline".

(if the image is above 95mb you must allow chunked uploads to download it).

# Contributing

If you want to help translating the extension into your language

First check if your language is listed in the [supported locales](https://developer.chrome.com/docs/extensions/reference/api/i18n#locales).

If the your language is listed there,

- [Fork](https://github.com/Stef-00012/Zipline-Upload-Extension/fork) the repository.
- Create a file `src/_locales/<locale_code>/messages.json` (replace `<locale_code>` with the code of your language, you can get it from the [supported locales](https://developer.chrome.com/docs/extensions/reference/api/i18n#locales) list).
- Translate the strings (use the [english file](https://github.com/Stef-00012/Zipline-Upload-Extension/blob/main/src/_locales/en/messages.json) as template).
- Make a pull request.

# Credits

Extension Code: [Stef-00012](https://github.com/Stef-00012)<br />
Popup UI: [Smartlinuxcoder](https://github.com/Smartlinuxcoder)<br />
Translations:
- English: [Stef-00012](https://github.com/Stef-00012)
  - English (UK): 
  - English (US): [Stef-00012](https://github.com/Stef-00012)
- Italian: [Stef-00012](https://github.com/Stef-00012)
- French: [KennySB-dev](https://github.com/KennySB-dev) & [SkyExploreWasTaken](https://github.com/SkyExploreWasTaken)
- Polish: [iHategithub9000](https://github.com/iHategithub9000)
- Romanian: [broisvoldemort](https://github.com/broisvoldemort) & [LeoMavri](https://github.com/LeoMavri) & [Lungu Stefan-Gabriel](https://github.com/lungustefan) 
- Indonesian: [Muhammad Ari Al Ghifari](https://github.com/alfari24)
- Hindi: [Vaibhav](https://github.com/VaibhavSys) & [Ibrahim Asif](https://github.com/Satindar31)
- Arabic: Cracky

<details>
  <summary>Some Images</summary>

  ![image](https://github.com/user-attachments/assets/b19d9fb5-44e8-4779-911c-737eacb70112)
  ![image](https://github.com/user-attachments/assets/43bef7a2-a54e-4241-8bcc-890bc1290805)
  ![image](https://github.com/user-attachments/assets/afcde9f0-7745-4b72-ab83-9922b1455683)
  ![image](https://github.com/user-attachments/assets/2a4e937e-bdc9-423a-a468-c2757a32c15f)
  ![image](https://github.com/user-attachments/assets/4db3e81e-2b22-467a-a72d-24e7f899b6b8)
  ![image](https://github.com/user-attachments/assets/dedb9987-a25b-49e2-99bc-5d6bac67c8f1)
  ![image](https://github.com/user-attachments/assets/a50caade-32c1-4825-9bed-b8197ca963ae)
  ![image](https://github.com/user-attachments/assets/a01a1f63-4358-4ca5-b793-bcc134c876ee)

</details>

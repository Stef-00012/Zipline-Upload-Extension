const translationElements = document.querySelectorAll("[data-translation]");
const importButton = document.getElementById("importSettings");
const exportButton = document.getElementById("exportSettings");
const filePicker = document.getElementById("filePicker");

for (const translationElement of translationElements) {
	const translationId = translationElement.dataset.translation;

	const translation = chrome.i18n.getMessage(translationId);

	if (translation) translationElement.innerText = translation;
}

const {
	ziplineVersion: currentVersion,
	ziplineToken,
	ziplineFolder: currentFolder,
	ziplineUrl,
} = await chrome.storage.local.get([
	"ziplineVersion",
	"ziplineToken",
	"ziplineFolder",
	"ziplineUrl",
]);
console.log(currentFolder);
updateVersionOptions(currentVersion || "v3");

const settings = [
	"ziplineUrl",
	"ziplineToken",
	"ziplineVersion",
	"ziplineImageMaxViews",
	"ziplineImageExpires",
	"ziplineImageCompression",
	"ziplineFileNameFormat",
	"ziplinePassword",
	"ziplineFolder",
	"ziplineOverrideDomain",
	"ziplineMaxUploadSize",
	"ziplineChunkSize",
	"ziplineZeroWidthSpaces",
	"ziplineEmbed",
	"ziplineOriginalName",
	"ziplineAllowChunkedUploads",
	"ziplineChunkedUploadsNotifications",
	"ziplineGeneralNotifications",
	"ziplineEnableExperimentalFeatures",
];

for (const setting of settings) {
	const element = document.getElementById(setting);

	const { [element.id]: elementData } = await chrome.storage.local.get([
		element.id,
	]);

	if (
		["text", "number", "password"].includes(element.type) ||
		element.tagName === "SELECT"
	) {
		element.value = elementData === "UNSET" ? "" : elementData;
	} else {
		element.checked = elementData === "true";
	}

	element.oninput = async () => {
		if (
			["text", "number", "password"].includes(element.type) ||
			element.tagName === "SELECT"
		) {
			await chrome.storage.local.set({
				[element.id]: String(element.value),
			});

			if (element.id === "ziplineVersion")
				updateVersionOptions(element.value || "v3");
		} else {
			await chrome.storage.local.set({
				[element.id]: element.checked ? "true" : "false",
			});

			try {
				if (
					element.id === "ziplineEnableExperimentalFeatures" &&
					element.checked
				) {
					console.log(element.checked, element.id);
					chrome.contextMenus.create({
						id: "Zipline_Upload_URL",
						title: "Upload URL with Zipliine [Experimental]",
						contexts: ["link"],
					});
				} else if (
					element.id === "ziplineEnableExperimentalFeatures" &&
					!element.checked
				) {
					console.log(element.checked, element.id);
					chrome.contextMenus.remove("Zipline_Upload_URL");
				}
			} catch (e) {
				console.log("unable to toogle experimental context menu options");
			}
		}
	};
}

importButton.onclick = async () => {
	filePicker.click();
};

exportButton.onclick = async () => {
	const exportData = {};

	for (const setting of settings) {
		const settingContent = await chrome.storage.local.get(setting);
		console.log(settingContent[setting]);
		exportData[setting] = settingContent[setting];
	}

	const stringifiedSettings = JSON.stringify(exportData, null, 4);

	const blob = new Blob([stringifiedSettings], {
		type: "application/json",
	});

	const link = document.createElement("a");
	link.href = URL.createObjectURL(blob);
	link.download = "ziplineSettings.json";

	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
};

filePicker.onchange = async (event) => {
	const file = event.target.files[0];

	if (!file) return;

	const reader = new FileReader();

	reader.onload = async (fileData) => {
		const jsonContent = fileData.target.result;
		let jsonSettings = {};

		try {
			jsonSettings = JSON.parse(jsonContent);
		} catch (e) {
			console.log(e);
		}

		for (const setting in jsonSettings) {
			if (!settings.includes(setting)) continue;

			await chrome.storage.local.set({
				[setting]: jsonSettings[setting],
			});
		}
	};

	reader.readAsText(file);
};

async function updateVersionOptions(version) {
	const versionElements = document.querySelectorAll("[data-zipline-version]");

	for (const versionElement of versionElements) {
		if (versionElement.dataset.ziplineVersion === version)
			versionElement.style.display = "block";
		else versionElement.style.display = "none";
	}

	if (version === "v4") {
		const folderSelectElement = document.getElementById("ziplineFolder");

		const noFolderOption = document.createElement("option");

		noFolderOption.value = "noFolder";
		noFolderOption.innerText = "No Folder";

		try {
			const res = await fetch(`${ziplineUrl}/api/user/folders?noincl=true`, {
				headers: {
					Authorization: ziplineToken,
				},
			});

			const folders = await res.json();

			const currentFolderExists = folders.find(
				(folder) => folder.id === currentFolder,
			);

			let selectedFolder = false;

			if (!currentFolderExists) {
				await chrome.storage.local.set({
					ziplineFolder: "noFolder",
				});
			}

			for (const folder of folders) {
				const folderName = folder.name;
				const folderId = folder.id;

				const option = document.createElement("option");

				option.value = folderId;
				option.innerText = folderName;

				if (folder.id === currentFolder) {
					option.selected = true;
					selectedFolder = true;
				}

				folderSelectElement.appendChild(option);
			}

			if (!selectedFolder) noFolderOption.selected = true;

			folderSelectElement.appendChild(noFolderOption);
		} catch (e) {
			noFolderOption.selected = true;

			folderSelectElement.appendChild(noFolderOption);
		}
	}
}

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
		element.value = elementData === null ? "" : elementData;
	} else {
		element.checked = elementData;
	}

	element.oninput = async () => {
		if (
			["text", "number", "password"].includes(element.type) ||
			element.tagName === "SELECT"
		) {
			await chrome.storage.local.set({
				[element.id]: element.value.length > 0 ? element.value : null,
			});

			if (element.id === "ziplineVersion") updateVersionOptions(element.value || "v3");
		} else {
			await chrome.storage.local.set({
				[element.id]: element.checked,
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
	const exportData = await chrome.storage.local.get(settings);

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

		const validSettings = validateSettings(jsonSettings)

		if (!validSettings) {
			return await chrome.notifications.create({
				title: "Error",
				message: "Invalid settings JSON.",
				type: "basic",
				iconUrl: chrome.runtime.getURL("icons/512.png"),
			});
		}

		for (const setting in jsonSettings) {
			if (!settings.includes(setting)) continue;

			await chrome.storage.local.set({
				[setting]: jsonSettings[setting],
			});

			document.getElementById(setting).value = jsonSettings[setting];
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

const urlRegex = /^http:\/\/(.*)?|https:\/\/(.*)?$/;
const validVersions = ["v3", "v4"];
const validExpirationTimes = [
	"never",
	"5m",
	"10m",
	"15m",
	"30m",
	"1h",
	"2h",
	"3h",
	"4h",
	"5h",
	"6h",
	"8h",
	"12h",
	"1d",
	"3d",
	"5d",
	"7d",
	"1w",
	"1.5w",
	"2w",
	"3w",
	"1M",
	"1.5M",
	"2M",
	"3M",
	"6M",
	"8M",
	"1y",
]
const validFileNameFormats = [
	"random",
	"date",
	"uuid",
	"name",
	"gfycat",
]

const validationFunctions = {
	ziplineUrl(setting) {
		return urlRegex.test(setting);
	},

	ziplineToken(setting) {
		return typeof setting === "string" && setting.length > 0
	},

	ziplineVersion(setting) {
		return validVersions.includes(setting);
	},

	ziplineImageMaxViews(setting) {
		const settingNumber = Number(setting)

		return setting === null || (!Number.isNaN(settingNumber) && settingNumber >= 0);
	},

	ziplineImageExpires(setting) {
		return validExpirationTimes.includes(setting);
	},

	ziplineImageCompression(setting) {
		const settingNumber = Number(setting)

		return !Number.isNaN(settingNumber) && settingNumber >= 0 && settingNumber <= 100;
	},

	ziplineFileNameFormat(setting) {
		return validFileNameFormats.includes(setting);
	},

	ziplinePassword(setting) {
		return setting === null || typeof setting === "string";
	},

	ziplineFolder(setting) {
		return setting === null || typeof setting === "string"
	},

	ziplineOverrideDomain(setting) {
		return setting === null || urlRegex.test(setting);
	},

	ziplineMaxUploadSize(setting) {
		const settingNumber = Number(setting)

		return !Number.isNaN(settingNumber) && settingNumber >= 0;
	},

	ziplineChunkSize(setting) {
		const settingNumber = Number(setting)

		return !Number.isNaN(settingNumber) && settingNumber >= 0;
	},

	ziplineZeroWidthSpaces(setting) {
		return typeof setting === "boolean";
	},

	ziplineEmbed(setting) {
		return typeof setting === "boolean";
	},

	ziplineOriginalName(setting) {
		return typeof setting === "boolean";
	},

	ziplineAllowChunkedUploads(setting) {
		return typeof setting === "boolean";
	},

	ziplineChunkedUploadsNotifications(setting) {
		return typeof setting === "boolean";
	},

	ziplineGeneralNotifications(setting) {
		return typeof setting === "boolean";
	},

	ziplineEnableExperimentalFeatures(setting) {
		return typeof setting === "boolean";
	}
}

function validateSettings(settingsToValidate) {
	for (const setting in settingsToValidate) {
		if (!validationFunctions[setting](settingsToValidate[setting])) return false;
	}

	return true;
}
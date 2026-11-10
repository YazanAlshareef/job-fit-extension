const $ = (id) => document.getElementById(id);

chrome.storage.local.get(["apiKey", "profile"]).then(({ apiKey, profile }) => {
  $("apiKey").value = apiKey ?? "";
  $("profile").value = profile ?? "";
});

$("save").addEventListener("click", async () => {
  await chrome.storage.local.set({ apiKey: $("apiKey").value.trim(), profile: $("profile").value });
  $("status").textContent = "Saved.";
  setTimeout(() => ($("status").textContent = ""), 2000);
});

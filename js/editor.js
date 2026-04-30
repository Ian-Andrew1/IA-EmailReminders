async function loadList(jsonFile) {
    const response = await fetch(jsonFile + '?t=' + Date.now());
    const data = await response.json();
    return data.items;
}

function renderList(items, container) {
    container.innerHTML = "";
    items.forEach((item, index) => {
        const div = document.createElement("div");
        div.className = "item-row";

        const input = document.createElement("input");
        input.value = item;

        const removeBtn = document.createElement("button");
        removeBtn.textContent = "Remove";
        removeBtn.onclick = () => {
            items.splice(index, 1);
            renderList(items, container);
        };

        div.appendChild(input);
        div.appendChild(removeBtn);
        container.appendChild(div);
    });
}

async function saveList(jsonFile, items, token, repoOwner, repoName) {
    const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${jsonFile}`;

    const getRes = await fetch(url, {
        headers: { "Authorization": `token ${token}` }
    });
    const getData = await getRes.json();

    const newContent = btoa(JSON.stringify({ items }, null, 2));

    await fetch(url, {
        method: "PUT",
        headers: {
            "Authorization": `token ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            message: `Update ${jsonFile}`,
            content: newContent,
            sha: getData.sha
        })
    });

    alert("Saved!");
}


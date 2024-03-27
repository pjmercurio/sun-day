function fetchGalleryImages() {
    fetch('https://us-central1-fresh-mason-364504.cloudfunctions.net/getSunDayGalleryImages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            folder: 'uploads'
        })
    })
    .then(response => response.json())
    .then(data => data.map(parseFilename))
    .then(files => files.sort((a, b) => b.timestamp.localeCompare(a.timestamp)))
    .then(sortedFiles => {
        const gallery = document.querySelector('.gallery');
        sortedFiles.forEach(file => {
            const galleryItem = createGalleryItem(file);
            gallery.appendChild(galleryItem);
        });
        gallery.style.opacity = 1;
    })
    .catch(error => {
        console.error('Error fetching gallery images:', error);
    });
}

function createGalleryItem(file) {
    const div = document.createElement('div');
    const img = document.createElement('img');
    const title = document.createElement('h2');
    const { imageUrl, name } = file;

    img.src = imageUrl;
    title.textContent = name;
    div.classList.add('gallery-image');
    div.addEventListener('click', () => openPhoto(imageUrl));
    div.appendChild(img);
    div.appendChild(title);

    return div;
}

function openPhoto(photo) {
    const photoFrame = document.getElementById('photo-frame');
    const photoImg = document.getElementById('photo');
    photoImg.src = photo;
    photoFrame.onclick = () => closePhoto(photoFrame, null);
    photoFrame.style.display = 'flex';
}

// Currently unused
function configureLoupe(photo) {
    const loupe = document.getElementById('loupe');
    const testImage = new Image();
    loupe.style.backgroundImage = `url(${photo})`;
    testImage.onload = function() {
        loupe.style.backgroundImage = `url(${maxresPhoto})`;
    };
    testImage.src = maxresPhoto;
}

function closePhoto(photoFrame, loupe) {
    photoFrame.style.display = 'none';
    document.body.style.cursor = 'default';
}

function parseFilename(imageUrl) {
    const filename = imageUrl.split("/").pop();
    const parts = filename.split("_");
    let name = "Anonymous";
    let timestamp = "";

    // Check the number of parts to determine the presence of "NAME"
    if (parts.length === 3) {
        name = parts[0];
        timestamp = parts[2].split(".")[0];
    } else if (parts.length === 2) {
        timestamp = parts[1].split(".")[0];
    } else {
        console.error("Unexpected filename format:", filename);
    }

    return { imageUrl, name, timestamp };
}

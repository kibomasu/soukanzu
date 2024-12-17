let cropper;
const personList = [];
let selectedPersons = [];
const diagram = document.getElementById('diagram');
const jsPlumbInstance = jsPlumb.getInstance();

document.getElementById('settings-button').addEventListener('click', () => {
  document.getElementById('settings').style.display = 'block';
});

document.getElementById('image').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const canvas = document.getElementById('preview');
  const ctx = canvas.getContext('2d');
  const img = new Image();

  img.onload = () => {
    canvas.width = 200;
    canvas.height = 200;
    ctx.drawImage(img, 0, 0, 200, 200); // サイズ固定
    canvas.style.display = 'block';

    cropper = new Cropper(canvas, { aspectRatio: 1 });
  };
  img.src = URL.createObjectURL(file);
});

document.getElementById('crop-button').addEventListener('click', () => {
  const canvas = cropper.getCroppedCanvas({ width: 200, height: 200 });
  document.getElementById('preview').dataset.croppedImage = canvas.toDataURL();

  // Cropperインスタンスは破棄せず完了ボタンでリセット
});

document.getElementById('person-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('name').value;
  const imgData = document.getElementById('preview').dataset.croppedImage;
  if (!name || !imgData) return;

  const personId = `person-${personList.length}`;
  personList.push({ id: personId, name, img: imgData });
  addPersonToList(personId, name, imgData);

  // 完了ボタンでトリミング要素をリセット
  cropper?.destroy();
  cropper = null;
  document.getElementById('preview').style.display = 'none';
  document.getElementById('settings').style.display = 'none';
  e.target.reset();
});

function addPersonToList(id, name, img) {
  const personDiv = document.createElement('div');
  personDiv.className = 'person-box';
  personDiv.textContent = name;
  personDiv.dataset.id = id;
  personDiv.addEventListener('click', () => togglePersonSelection(id));
  document.getElementById('person-list').appendChild(personDiv);
}

function togglePersonSelection(personId) {
  const personDiv = document.querySelector(`[data-id="${personId}"]`);

  if (selectedPersons.includes(personId)) {
    // 選択を解除
    selectedPersons = selectedPersons.filter((id) => id !== personId);
    personDiv.style.borderColor = '#ccc';
  } else {
    // 選択を追加
    selectedPersons.push(personId);
    personDiv.style.borderColor = 'blue';
  }

  if (selectedPersons.length === 2) {
    openRelationSettings(selectedPersons[0], selectedPersons[1]);
  }
}

function openRelationSettings(personAId, personBId) {
  const personA = personList.find((p) => p.id === personAId);
  const personB = personList.find((p) => p.id === personBId);

  document.getElementById('relation-settings').style.display = 'block';
  document.getElementById('relation-save-button').onclick = () => {
    const relationA = document.getElementById('relation-a').value;
    const relationB = document.getElementById('relation-b').value;
    if (!relationA || !relationB) return;

    addRelation(personA, personB, relationA, relationB);
    document.getElementById('relation-settings').style.display = 'none';
    selectedPersons = []; // リセット
    resetPersonSelection();
  };
}

function resetPersonSelection() {
  document.querySelectorAll('.person-box').forEach((box) => {
    box.style.borderColor = '#ccc';
  });
}

function addRelation(personA, personB, relationA, relationB) {
  const iconA = addIconToDiagram(personA);
  const iconB = addIconToDiagram(personB);

  // 関係文と矢印を作成
  createArrowWithText(iconA, iconB, relationA, true); // A→B
  createArrowWithText(iconB, iconA, relationB, false); // B→A
}

function createArrowWithText(source, target, text, isAbove) {
  const overlayId = `arrow-overlay-${source.id}-${target.id}`;
  const textDiv = document.createElement('div');
  textDiv.className = 'arrow-text';
  textDiv.textContent = text;

  diagram.appendChild(textDiv);

  jsPlumbInstance.connect({
    source,
    target,
    overlays: [
      ['Arrow', { location: 0.5 }],
      [
        'Custom',
        {
          create: () => textDiv,
          location: 0.5, // 中央に配置
          css: {
            transform: isAbove ? 'translateY(-40px)' : 'translateY(40px)', // A→Bは40px上、B→Aは40px下
          },
        },
      ],
    ],
  });
}




function addIconToDiagram(person) {
  let icon = document.getElementById(person.id);
  if (icon) return icon;

  icon = document.createElement('div');
  icon.id = person.id;
  icon.className = 'person-icon';
  icon.innerHTML = `<img src="${person.img}" alt="${person.name}"><p>${person.name}</p>`;
  diagram.appendChild(icon);
  jsPlumbInstance.draggable(icon);
  return icon;
}

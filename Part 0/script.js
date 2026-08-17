function showNotes() {
    noteList.innerHTML = "";

    notes.forEach(function(note, index) {
        const li = document.createElement("li");
        li.textContent = note + " ";

        const editButton = document.createElement("button");
        editButton.textContent = "Edit";

        editButton.addEventListener("click", function() {
            const newNote = prompt("Edit your note:", notes[index]);

            if (newNote !== null && newNote !== "") {
                notes[index] = newNote;
                localStorage.setItem("notes", JSON.stringify(notes));
                showNotes();
            }
        });

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", function() {
            notes.splice(index, 1);
            localStorage.setItem("notes", JSON.stringify(notes));
            showNotes();
        });

        li.appendChild(editButton);
        li.appendChild(deleteButton);
        noteList.appendChild(li);
    });
}
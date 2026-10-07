const loadButton = document.querySelector("#load-users");
const filterInput = document.querySelector("#filter-input");
const status = document.querySelector("#status");
const usersList = document.querySelector("#users-list");

let users = [];

async function loadUsers() {
    status.textContent = "Loading users...";
    loadButton.disabled = true;

    try {
        const response = await fetch(
            "https://jsonplaceholder.typicode.com/users"
        );

        if (!response.ok) {
            throw new Error("Failed to load users.");
        }

        users = await response.json();

        renderUsers(users);

        status.textContent = `Loaded ${users.length} users.`;
    } catch (error) {
        status.textContent = "Unable to load users. Please try again.";
    } finally {
        loadButton.disabled = false;
    }
}

function renderUsers(list) {
    usersList.textContent = "";

    list.forEach((user) => {
        const listItem = document.createElement("li");

        const name = document.createElement("h2");
        name.textContent = user.name;

        const email = document.createElement("p");
        email.textContent = `Email: ${user.email}`;

        const city = document.createElement("p");
        city.textContent = `City: ${user.address.city}`;

        const company = document.createElement("p");
        company.textContent = `Company: ${user.company.name}`;

        listItem.appendChild(name);
        listItem.appendChild(email);
        listItem.appendChild(city);
        listItem.appendChild(company);

        usersList.appendChild(listItem);
    });
}

loadButton.addEventListener("click", loadUsers);

filterInput.addEventListener("input", () => {
    const filterText = filterInput.value.trim().toLowerCase();

    const filteredUsers = users.filter((user) =>
        user.name.toLowerCase().includes(filterText)
    );

    renderUsers(filteredUsers);

    if (filteredUsers.length === 0) {
        status.textContent = "No users match your filter.";
    } else {
        status.textContent = `Showing ${filteredUsers.length} users.`;
    }
});
let expenses = [];
let currentEditIndex = -1;

function addExpense() {
    let name = document.getElementById("expenseName").value;
    let amount = document.getElementById("amount").value;
    let category = document.getElementById("category").value;

    let expense = {
        name: name,
        amount: amount,
        category: category
    };

    expenses.push(expense);

    clearInputs();
    displayExpenses();
}

function displayExpenses() {
    let list = document.getElementById("expenseList");
    list.innerHTML = "";

    let total = 0;

    for (let i = 0; i < expenses.length; i++) {
        let expense = expenses[i];
        total += expense.amount;

        let li = document.createElement("li");
        li.innerHTML = expense.name + " - $" + expense.amount + " (" + expense.category + ") " +
            "<button onclick='editExpense(" + i + ")'>Edit</button> " +
            "<button onclick='deleteExpense(" + i + ")'>Delete</button>";

        list.appendChild(li);
    }

    document.getElementById("totalAmount").innerText = total;
}

function deleteExpense(index) {
    expenses.splice(index, 1);

    if (currentEditIndex === index) {
        currentEditIndex = -1;
        clearInputs();
    }

    displayExpenses();
}

function editExpense(index) {
    let expense = expenses[index];

    document.getElementById("expenseName").value = expense.name;
    document.getElementById("amount").value = expense.amount;
    document.getElementById("category").value = expense.category;

    currentEditIndex = index;
}

function updateExpense() {
    let name = document.getElementById("expenseName").value;
    let amount = document.getElementById("amount").value;
    let category = document.getElementById("category").value;

    expenses[currentEditIndex].name = name;
    expenses[currentEditIndex].amount = amount;
    expenses[currentEditIndex].category = category;

    currentEditIndex = -1;
    clearInputs();
    displayExpenses();
}

function clearInputs() {
    document.getElementById("expenseName").value = "";
    document.getElementById("amount").value = "";
    document.getElementById("category").value = "Food";
}
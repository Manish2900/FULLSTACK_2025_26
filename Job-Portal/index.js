let btn = document.getElementById("btn");
let job = document.getElementById("job");
const myForm = document.getElementById("form");

btn.addEventListener("click", (event) => {
    event.preventDefault();

    let name = document.getElementById("company-name").value;
    let position = document.getElementById("job-position").value;
    let location = document.getElementById("job-location").value;
    let desc = document.getElementById("job-description").value;
    let salary = document.getElementById("salary-range").value;

    let div = document.createElement("div");
    div.classList.add("cart-job")
   
    div.innerHTML = `
        <h1>${position}</h1>
        <h2>${name}</h2>
        <h4>${location}</h4>
        <p>${desc}<br>$${salary}</p>
    `

    job.appendChild(div);

    myForm.reset();
})
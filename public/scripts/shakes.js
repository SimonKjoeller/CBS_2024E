// Select all dropdown buttons
const dropdownButtons = document.querySelectorAll('.dropdown-btn');

// Add event listeners to each button
dropdownButtons.forEach(button => {
    button.addEventListener('click', function () {
        const dropdownContent = this.nextElementSibling; // Get the dropdown content
        dropdownContent.classList.toggle('show'); // Toggle the "show" class

        // Close other dropdowns if open
        document.querySelectorAll('.dropdown-content').forEach(content => {
            if (content !== dropdownContent && content.classList.contains('show')) {
                content.classList.remove('show');
            }
        });
    });
});

// Close the dropdown if the user clicks outside of it
window.addEventListener('click', function (event) {
    if (!event.target.matches('.dropdown-btn')) {
        document.querySelectorAll('.dropdown-content').forEach(content => {
            content.classList.remove('show');
        });
    }
});

document.addEventListener('DOMContentLoaded', function () {
	const switchMode = document.getElementById('switch-mode');

	// Retrieve user preference from localStorage
	const darkModePreference = localStorage.getItem('switch-mode');

	// Set the initial state based on user preference
	if (darkModePreference === 'dark') {
		document.body.classList.add('dark');
		switchMode.checked = true;
	} else {
		document.body.classList.remove('dark');
		switchMode.checked = false;
	}

	// Listen for changes in the switch
	switchMode.addEventListener('change', function () {
		// Toggle dark mode class on the body
		document.body.classList.toggle('dark', this.checked);

		// Store user preference in localStorage
		localStorage.setItem('switch-mode', this.checked ? 'dark' : 'light');
	});
});
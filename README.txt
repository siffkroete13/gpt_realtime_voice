
➵ Node.js Server Setup:

In Powershell:

	1: winget install OpenJS.NodeJS
		
		Überprüfung:	node -v
						npm -v
	
	2: npm install express

	3: npm start (muss sich im Projektverzeichnis befinden)



➵ File purposes:

Configs:

		vite.config.js - configuration file for Vite, efficient production builds., serving the full-stack app from /client folder.

	tailwind.config.js - configuration file for TailwindCSS. 	
	postcss.config.cjs - configuration file for PostCSS. 	 	

		  package.json - configuration file for your Node.js + Vite + React project.
	 package-lock.json - an auto-generated file that locks the exact versions of dependencies installed. It ensures that dependency trees are optimized for performance.

	 	   .prettierrc - the configuration file for Prettier, a popular code formatter.


Server:

		 server.js : A backend API to generate OpenAI real-time tokens.
					 A middleware server to integrate Vite for React SSR (Server-Side Rendering).
					 A full-stack application entry point, handling both API routes and SSR rendering.


Client: 		   

	server-entry.jsx - executed on the server. Its primary role is to generate the HTML content for the page, which is then sent to the client.
	entry-client.jsx - executed on the client. "Hydrates" the HTML that was initially rendered by the server, making the page interactive on the client side.
		   index.jsx - starts the client-side React application, ensuring dynamic interactivity once the HTML is ready.

		    index.js - future developing, does nothing now. Used for lazy js routing.

		  index.html - the basic structure and template of the web page that is rendered in the browser.



Security:

	.gitignore - the file that tells Git which forbidden-to-see files and directories to ignore in version control.
	      .env - stores the forbidden-to-see variables.


Style:

	  base.css - the styles file, used across the app.


Folders:

	  components - elements that appear on the console: button, map etc.
		  assets - images, videos etc.
	node_modules - all the dependencies installed.



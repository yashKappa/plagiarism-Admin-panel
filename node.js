const express = require("express");
const path = require('path');
const sql = require("mssql");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const session = require('express-session');
const mysql = require("mysql");
const MSSQLStore = require('connect-mssql')(session);
const app = express();
const PORT = 3000;
const multer = require('multer');
const fileUpload = require('express-fileupload');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'ads'
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
  } else {
    console.log('Connected to MySQL database');
  }
});

// Routes
app.get("/", function (req, res) {
  const username = req.cookies.username;
  const logged = req.cookies.logged;
  const teacher = req.cookies.teacher;
  const admin = req.cookies.admin;


  if (admin && logged === 'true') {
    // If the user is logged in, redirect to the user panel page
    res.redirect(`/admin_home`);
  } else {
    // If the user is not logged in, serve the index.html page
    res.redirect(`/index.html`);
  }
});






app.get("/logout", (req, res) => {
  // Clear cookies and session and redirect to index.html
  res.clearCookie('username');
  res.clearCookie('logged');
  res.clearCookie('teacher');
  res.clearCookie('admin');
    res.redirect("/index.html");
});

app.get("/student/userpanel", (req, res) => {
  if (req.session.user) {
    res.redirect("student user/userpanel.html");
  } else {
    res.redirect("/login");
  }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});



/*------------------------------------file or folder upload---------------------------------*/

// database.js
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

app.use(express.json());

app.get("/status", (req, res) => {
  const query = "SELECT filename, project_name, summary FROM file";
  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching data from database: ", err);
      res.status(500).send("Internal Server Error");
    } else {
      res.render("status", { files: results });
    }
  });
});
// Assuming you have Express set up and your EJS view engine configured

// Update the route handler
app.set('views', path.join(__dirname, 'views'));

// Set the 'public' directory for static files
app.use(express.static(path.join(__dirname, 'public')));

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Define a route to fetch data from the 'student' table
app.get('/status', async (req, res) => {
  try {
    // Connect to MSSQL using dbConfig
    await sql.connect(dbConfig);

    // Query the database
    const result = await sql.query('SELECT * FROM student');

    // Render the 'status.ejs' page and pass the query results
    res.render('status', { data: result.recordset, title: 'File Status' });
  } catch (err) {
    console.error('Error executing MSSQL query:', err);
    res.status(500).send('Internal Server Error');
  } finally {
    // Close the MSSQL connection
    sql.close();
  }
});


// Serve the status.html file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'status.html'));
});




/*------------------------------------admin_student login---------------------------------*/


app.post("/admin", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  const query = "SELECT * FROM admin WHERE username = ? AND password = ?";
  connection.query(query, [username, password], (error, results) => {
    if (error) {
      console.error("Error occurred during login:", error);
      res.status(500).send("Internal server error");
    } else if (results.length > 0) {
      // Set cookies for username and login status
      res.cookie('admin', username);
      res.cookie('logged', 'true');
      // Set session variable (Note: Cookies are accessed through req.cookies, not req.cookies.user)
      res.redirect("admin_home");
    } else {
      // Render the login page with an error message
      res.redirect("/index.html?error=Invalid Username or Password");
    }
  });
});
/*------------------------------------admin_student login---------------------------------*/

/*------------------------------------student fetch data---------------------------------*/

app.get('/student', (req, res) => {
  try {
      // Query the MySQL database to get the total number of users
      connection.query('SELECT COUNT(*) AS totalUsers FROM student', (error, countResult) => {
          if (error) {
              console.error('Error fetching total number of users:', error);
              res.status(500).send('Internal Server Error');
              return;
          }
          
          const totalUsers = countResult[0].totalUsers;

          // Query the MySQL database to get student data
          connection.query('SELECT * FROM student', (error, studentResult) => {
              if (error) {
                  console.error('Error executing MySQL query:', error);
                  res.status(500).send('Internal Server Error');
                  return;
              }
              
              // Render the 'student.ejs' page and pass the query results
              res.render('student', { data: studentResult, totalUsers: totalUsers, title: 'File Status' });
          });
      });
  } catch (err) {
      console.error('Error handling MySQL query:', err);
      res.status(500).send('Internal Server Error');
  }
});

// Handle other routes...

// Serve the student.html file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'student.html'));
});

/*------------------------------------student fetch data---------------------------------*/

/*------------------------------------teacher fetch data---------------------------------*/

app.get('/teacher', (req, res) => {
  try {
    // Query the MySQL database to get the total number of users
    connection.query('SELECT COUNT(*) AS totalUsers FROM teacher', (error, countResult) => {
      if (error) {
        console.error('Error fetching total number of users:', error);
        res.status(500).send('Internal Server Error');
        return;
      }
      
      const totalUsers = countResult[0].totalUsers;

      // Query the MySQL database to get teacher data
      connection.query('SELECT * FROM teacher', (error, teacherResult) => {
        if (error) {
          console.error('Error executing MySQL query:', error);
          res.status(500).send('Internal Server Error');
          return;
        }
        
        // Render the 'teacher.ejs' page and pass the query results and totalUsers count
        res.render('teacher', { data: teacherResult, totalUsers: totalUsers, title: 'Teacher Data' });
      });
    });
  } catch (err) {
    console.error('Error handling MySQL query:', err);
    res.status(500).send('Internal Server Error');
  }
});

// Handle other routes...

// Serve the student.html file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'teacher.html'));
});
/*------------------------------------teacher fetch data---------------------------------*/

/*------------------------------------User file fetch data---------------------------------*/

// Add a new route for downloading files
app.get('/download/:id', (req, res) => {
  const fileId = req.params.id;

  // Query the MySQL database to get file information based on the provided id
  connection.query('SELECT * FROM file WHERE id = ?', [fileId], (error, results, fields) => {
    if (error) {
      console.error('Error executing MySQL query:', error);
      res.status(500).send('Internal Server Error');
    } else {
      // Assuming 'data' is the column with BLOB data and 'filename' is the original filename
      const fileData = results[0].data; // Access the BLOB data from the first result (adjust as needed)
      const filename = results[0].filename; // Access the filename from the first result (adjust as needed)

      // Set response headers for file download
      res.setHeader('Content-disposition', 'attachment; filename=' + filename);
      res.setHeader('Content-type', 'application/octet-stream');

      // Send the BLOB data as the response
      res.send(fileData);
    }
  });
});

app.get('/index', (req, res) => {
  try {
    // Query the MySQL database to select distinct username, project_name, and summary
    connection.query('SELECT username, project_name, summary FROM file GROUP BY username, project_name, summary', (error, results, fields) => {
      if (error) {
        console.error('Error executing MySQL query:', error);
        res.status(500).send('Internal Server Error');
      } else {
        // Render the 'index' page and pass the query results
        res.render('index', { data: results, title: 'User Projects' });
      }
    });
  } catch (err) {
    console.error('Error handling MySQL query:', err);
    res.status(500).send('Internal Server Error');
  }
});


/*------------------------------------User file fetch data---------------------------------*/
// Add this route to handle getFileContent requests


// Your existing /index route remains unchanged
// Add a new route to handle the click on the project name
// Update the /user route to fetch distinct username and project_name

// Add this route in your main server file
// Add this route in your main server file (app.js or index.js)

// Add this route in your main server file (app.js or index.js)


// Route to delete a project
app.get('/user', (req, res) => {
  try {
    const storedUsername = req.cookies.username;

    if (!storedUsername) {
      return res.status(401).send('Unauthorized. Please log in.');
    }

    connection.query('SELECT DISTINCT username, project_name, summary FROM file WHERE username = ?', [storedUsername], (error, results) => {
      if (error) {
        console.error('Error executing MySQL query:', error);
        res.status(500).send('Internal Server Error');
      } else {
        res.render('user', { data: results, title: 'User Projects' });
      }
    });
  } catch (err) {
    console.error('Error handling MySQL query:', err);
    res.status(500).send('Internal Server Error');
  }
});


// Route to delete a project
app.post('/user/delete', (req, res) => {
  try {
    const storedUsername = req.cookies.username;

    const projectNamesToDelete = req.body.selectedProjects.map(project => project.projectName);

    if (!projectNamesToDelete || projectNamesToDelete.length === 0) {
      return res.status(400).json({ success: false, error: 'No projects selected for deletion.' });
    }

    const placeholders = projectNamesToDelete.map(() => '?').join(', ');
    const deleteQuery = `DELETE FROM file WHERE project_name IN (${placeholders}) AND username = ?`;

    console.log('Delete Query:', deleteQuery);
    console.log('Delete Parameters:', [...projectNamesToDelete, storedUsername]);

    connection.query(deleteQuery, [...projectNamesToDelete, storedUsername], (error, results) => {
      if (error) {
        console.error('Error deleting projects:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
      } else {
        console.log('Deletion successful. Rows affected:', results.affectedRows);

        // Fetch updated data from the server
        connection.query('SELECT DISTINCT username, project_name FROM file WHERE username = ?', [storedUsername], (error, results) => {
          if (error) {
            console.error('Error executing MySQL query:', error);
            res.status(500).json({ success: false, error: 'Internal Server Error' });
          } else {
            res.json({
              success: true,
              deletedProjects: projectNamesToDelete,
              updatedData: results,
            });
          }
        });
      }
    });
  } catch (err) {
    console.error('Error handling deletion:', err);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});




// Add a new route to handle the click on the project name and fetch related files
app.get('/related/:username/:projectName', (req, res) => {
  const storedUsername = req.cookies.username;
  const projectName = req.params.projectName;

  try {
    // Check if the username is present in cookies
    if (!storedUsername) {
      return res.status(401).send('Unauthorized. Please log in.');
    }

    // Query the MySQL database to fetch files related to the stored username and project name
    const query = `
      SELECT *
      FROM file
      WHERE username = ? AND project_name = ?
    `;

    connection.query(query, [storedUsername, projectName], (error, results, fields) => {
      if (error) {
        console.error('Error executing MySQL query:', error);
        res.status(500).send('Internal Server Error');
      } else {
        // Render the 'related' page and pass the query results
        res.render('related', { data: results, title: 'Related Files', username: storedUsername, projectName });
      }
    });
  } catch (err) {
    console.error('Error handling MySQL query:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/related', (req, res) => {
  try {
    // Query the MySQL database
    connection.query('SELECT * FROM file', (error, results, fields) => {
      if (error) {
        console.error('Error executing MySQL query:', error);
        res.status(500).send('Internal Server Error');
      } else {
        // Render the 'index' page and pass the query results
        res.render('related', { data: results, title: 'File List' });
      }
    });
  } catch (err) {
    console.error('Error handling MySQL query:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/userdata', (req, res) => {
  try {
    // Query the MySQL database
    connection.query('SELECT * FROM file', (error, results, fields) => {
      if (error) {
        console.error('Error executing MySQL query:', error);
        res.status(500).send('Internal Server Error');
      } else {
        // Render the 'index' page and pass the query results
        res.render('userdata', { data: results, title: 'File List' });
      }
    });
  } catch (err) {
    console.error('Error handling MySQL query:', err);
    res.status(500).send('Internal Server Error');
  }
});


app.get('/profile', (req, res) => {
  try {
    const storedUsername = req.cookies.username;

    if (!storedUsername) {
      return res.status(401).send('Unauthorized. Please log in.');
    }

    connection.query('SELECT DISTINCT username, email, password, image, lang, exp, professional, education, skill FROM student WHERE username = ?', [storedUsername], (error, results) => {
      if (error) {
        console.error('Error executing MySQL query:', error);
        res.status(500).send('Internal Server Error');
      } else {
        // Convert image data to Base64 string
        if (results[0].image && results[0].image instanceof Buffer) {
          results[0].image = 'data:image/jpeg;base64,' + results[0].image.toString('base64');
        }

        res.render('profile', { data: results, title: 'User Projects' });
      }
    });
  } catch (err) {
    console.error('Error handling MySQL query:', err);
    res.status(500).send('Internal Server Error');
  }
});
/*
app.post("/profile/image", (req, res) => {
  try {
    const storedUsername = req.cookies.username;

    if (!storedUsername) {
      return res.status(401).send("Invalid username. Please log in with the correct username.");
    }

    if (!req.files || !req.files.image) {
      console.error("No image file uploaded.");
      return res.status(400).send("No image file uploaded.");
    }

    const image = req.files.image;
    const imageData = image.data;

    const updateQuery = "UPDATE student SET image=? WHERE username=?";

    connection.query(updateQuery, [imageData, storedUsername], (err, result) => {
      if (err) {
        console.error("Error updating image:", err);
        res.redirect("../profile");
      } else {
        res.redirect("../profile");
        res.status(200).end();
      }
    });
  } catch (error) {
    console.error("Error in image update route:", error);
    res.redirect("../profile");
    res.status(500).send("Internal Server Error");
  }
});
*/

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // Assuming your static files are in the 'public' folder
app.use(fileUpload());

app.post("/profile/data", (req, res) => {
  try {
      const storedUsername = req.cookies.username;

      if (!storedUsername) {
          return res.status(401).send("Invalid username. Please log in with the correct username.");
      }

      const { lang, skill, exp, professional, education } = req.body;

      const updateQuery = `
          UPDATE student
          SET lang=TRIM(BOTH ',' FROM CONCAT_WS(', ', IFNULL(NULLIF(TRIM(BOTH ',' FROM lang), ''), ''), ?)),
              skill=TRIM(BOTH ',' FROM CONCAT_WS(', ', IFNULL(NULLIF(TRIM(BOTH ',' FROM skill), ''), ''), ?)),
              exp=TRIM(BOTH ',' FROM CONCAT_WS(', ', IFNULL(NULLIF(TRIM(BOTH ',' FROM exp), ''), ''), ?)),
              professional=TRIM(BOTH ',' FROM CONCAT_WS(', ', IFNULL(NULLIF(TRIM(BOTH ',' FROM professional), ''), ''), ?)),
              education=TRIM(BOTH ',' FROM CONCAT_WS(', ', IFNULL(NULLIF(TRIM(BOTH ',' FROM education), ''), ''), ?))
          WHERE username=?
      `;

      connection.query(
          updateQuery,
          [lang, skill, exp, professional, education, storedUsername],
          (err, result) => {
              if (err) {
                  console.error("Error updating profile data:", err);
                  res.redirect("../profile");
              } else {
                  res.status(200).send("Profile updated successfully");
              }
          }
      );
  } catch (error) {
      console.error("Error in profile data update route:", error);
      res.status(500).send("Internal Server Error");
  }
});


app.post('/removeSkill', (req, res) => {
  // Extract the username from the request
  const storedUsername = req.cookies.username;

  // Check if the username is defined
  if (!storedUsername) {
      return res.status(401).send("Invalid username. Please log in with the correct username.");
  }

  // Extract the skill to remove from the request body
  const langToRemove = req.body.langName;

  // Fetch the current list of skills from the database
  connection.query('SELECT lang FROM student WHERE username = ?', [storedUsername], (err, result) => {
      if (err) {
          console.error("Error fetching skills:", err);
          res.status(500).send("Error fetching skills");
      } else {
          // Extract the skills from the result
          const currentLang = result[0].lang.split(',').map(lang => lang.trim());
          const updatedLang = currentLang.filter(lang => lang !== langToRemove);
          const updatedLangString = updatedLang.join(', ');

          // Update the 'student' table with the updated skills

          // Update the 'student' table with the updated skills
          connection.query('UPDATE student SET lang = ? WHERE username = ?', [updatedLangString, storedUsername], (err, result) => {
              if (err) {
                  console.error("Error updating skills:", err);
                  res.status(500).send("Error updating skills");
              } else {
                  console.log("Skill removed successfully");
                  res.status(200).send("Skill removed successfully");
              }
          });
      }
  });
});



app.post('/removeDATA', (req, res) => {
  // Extract the username from the request
  const storedUsername = req.cookies.username;

  // Check if the username is defined
  if (!storedUsername) {
      return res.status(401).send("Invalid username. Please log in with the correct username.");
  }

  // Extract the skill to remove from the request body
  const skillToRemove = req.body.skillName;

  // Fetch the current list of skills from the database
  connection.query('SELECT skill FROM student WHERE username = ?', [storedUsername], (err, result) => {
      if (err) {
          console.error("Error fetching skills:", err);
          res.status(500).send("Error fetching skills");
      } else {

          const currentSkill = result[0].skill.split(',').map(skill => skill.trim());
          const updatedSkill = currentSkill.filter(skill => skill !== skillToRemove);
          const updatedSkillString = updatedSkill.join(', ');

          // Update the 'student' table with the updated skills

          // Update the 'student' table with the updated skills
          connection.query('UPDATE student SET skill = ? WHERE username = ?', [updatedSkillString, storedUsername], (err, result) => {
              if (err) {
                  console.error("Error updating skills:", err);
                  res.status(500).send("Error updating skills");
              } else {
                  console.log("Skill removed successfully");
                  res.status(200).send("Skill removed successfully");
              }
          });
      }
  });
});

app.post('/removeEDU', (req, res) => {
  // Extract the username from the request
  const storedEducationUsername = req.cookies.username;

  // Check if the username is defined
  if (!storedEducationUsername) {
      return res.status(401).send("Invalid username. Please log in with the correct username.");
  }

  // Extract the education to remove from the request body
  const educationToRemove = req.body.educationName;

  // Fetch the current list of educations from the database
  connection.query('SELECT education FROM student WHERE username = ?', [storedEducationUsername], (err, result) => {
      if (err) {
          console.error("Error fetching educations:", err);
          res.status(500).send("Error fetching educations");
      } else {
          const currentEducation = result[0].education.split(',').map(education => education.trim());
          const updatedEducation = currentEducation.filter(education => education !== educationToRemove);
          const updatedEducationString = updatedEducation.join(', ');

          // Update the 'student' table with the updated educations
          connection.query('UPDATE student SET education = ? WHERE username = ?', [updatedEducationString, storedEducationUsername], (err, result) => {
              if (err) {
                  console.error("Error updating educations:", err);
                  res.status(500).send("Error updating educations");
              } else {
                  console.log("Education removed successfully");
                  res.status(200).send("Education removed successfully");
              }
          });
      }
  });
});


app.post('/removeProfessional', (req, res) => {
  // Extract the username from the request
  const storedUsername = req.cookies.username;
  const profToRemove = req.body.profName;

  // Check if the username is defined
  if (!storedUsername) {
      return res.status(401).send("Invalid username. Please log in with the correct username.");
  }

  // Fetch the current list of professional data from the database
  connection.query('SELECT professional FROM student WHERE username = ?', [storedUsername], (err, result) => {
      if (err) {
          console.error("Error fetching professional data:", err);
          res.status(500).send("Error fetching professional data");
      } else {
          const currentProf = result[0].professional.split(',').map(prof => prof.trim());
          const updatedProf = currentProf.filter(prof => prof !== profToRemove);
          const updatedProfString = updatedProf.join(', ');

          // Update the 'student' table with the updated professional data
          connection.query('UPDATE student SET professional = ? WHERE username = ?', [updatedProfString, storedUsername], (err, result) => {
              if (err) {
                  console.error("Error updating professional data:", err);
                  res.status(500).send("Error updating professional data");
              } else {
                  console.log("Professional data removed successfully");
                  res.status(200).send("Professional data removed successfully");
              }
          });
      }
  });
});


app.get('/fileDetails/:username/:projectName', (req, res) => {
  const projectName = req.params.projectName;

  try {
    // Query the MySQL database to fetch files related to the provided username and project name
    const query = `
      SELECT *
      FROM file
      WHERE username = ? AND project_name = ?
    `;

    connection.query(query, [req.params.username, projectName], (error, results, fields) => {
      if (error) {
        console.error('Error executing MySQL query:', error);
        res.status(500).send('Internal Server Error');
      } else {
        // Render the 'related' page and pass the query results
        res.render('related', { data: results, title: 'Related Files', username: req.params.username, projectName });
      }
    });
  } catch (err) {
    console.error('Error handling MySQL query:', err);
    res.status(500).send('Internal Server Error');
  }
});


app.get('/plagi', (req, res) => {
  try {
    // Query the MySQL database to select distinct username, project_name, and summary
    connection.query('SELECT username, project_name, summary FROM file GROUP BY username, project_name, summary', (error, results, fields) => {
      if (error) {
        console.error('Error executing MySQL query:', error);
        res.status(500).send('Internal Server Error');
      } else {
        // Render the 'index' page and pass the query results
        res.render('plagi', { data: results, title: 'User Projects' });
      }
    });
  } catch (err) {
    console.error('Error handling MySQL query:', err);
    res.status(500).send('Internal Server Error');
  }
});


app.get('/plagiarism', (req, res) => {
  try {
    // Query the MySQL database to select distinct username, project_name, and summary
    connection.query('SELECT username, project_name, summary FROM file GROUP BY username, project_name, summary', (error, results, fields) => {
      if (error) {
        console.error('Error executing MySQL query:', error);
        res.status(500).send('Internal Server Error');
      } else {
        // Render the 'index' page and pass the query results
        res.render('plagiarism', { data: results, title: 'User Projects' });
      }
    });
  } catch (err) {
    console.error('Error handling MySQL query:', err);
    res.status(500).send('Internal Server Error');
  }
});


app.get('/plagiarism/:username/:projectName', (req, res) => {
  const projectName = req.params.projectName;

  // Query the MySQL database to fetch filenames and data related to the project name
  const query = `
    SELECT filename, data
    FROM file
    WHERE project_name = ?
  `;

  connection.query(query, [projectName], (error, results, fields) => {
    if (error) {
      console.error('Error executing MySQL query:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      try {
        // Convert binary data to plain text
        const filesData = results.map(result => ({
          filename: result.filename,
          data: result.data.toString('utf-8') // Convert binary data to text
        }));
        res.json(filesData);
      } catch (err) {
        console.error('Error processing data:', err);
        res.status(500).json({ error: 'Error processing data' });
      }
    }
  });
});






app.get('/plagiarism', (req, res) => {
  try {
    // Query the MySQL database
    connection.query('SELECT * FROM file', (error, results, fields) => {
      if (error) {
        console.error('Error executing MySQL query:', error);
        res.status(500).send('Internal Server Error');
      } else {
        // Render the 'index' page and pass the query results
        res.render('related', { data: results, title: 'File List' });
      }
    });
  } catch (err) {
    console.error('Error handling MySQL query:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/profile', (req, res) => {
  // Execute the SQL query to get total projects count
  connection.query('SELECT COUNT(*) AS totalProjects FROM student WHERE project_name IS NOT NULL', (error, results) => {
    if (error) {
      throw error;
    }
    // Render the EJS template with the count of total projects
    res.render('profile', { totalProjects: results[0].totalProjects });
  });
});

app.delete('/deleteUser', (req, res) => {
  const userId = req.query.id; // Assuming the ID is passed as a query parameter
  
  // Delete user data from the database based on the user ID
  const sql = 'DELETE FROM student WHERE id = ?';
  connection.query(sql, [userId], (error, results) => {
      if (error) {
          console.error('Error deleting user data:', error);
          res.status(500).send('Error deleting user data');
      } else {
          console.log('User data deleted successfully');
          res.sendStatus(200); // Send success status
      }
  });
});

app.delete('/deleteUser', (req, res) => {
  const userId = req.query.id; // Assuming the ID is passed as a query parameter
  
  // Delete user data from the database based on the user ID
  const sql = 'DELETE FROM teacher WHERE id = ?';
  connection.query(sql, [userId], (error, results) => {
      if (error) {
          console.error('Error deleting user data:', error);
          res.status(500).send('Error deleting user data');
      } else {
          console.log('User data deleted successfully');
          res.sendStatus(200); // Send success status
      }
  });
});

app.get('/new-user-count', (req, res) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // Months are zero-based in JavaScript

  // Construct the start and end dates of the current month
  const startDate = `${currentYear}-${currentMonth}-01`;
  const endDate = `${currentYear}-${currentMonth + 1}-01`; // Next month's 1st day

  // Query to count new users registered in the current month
  const query = `
    SELECT COUNT(*) AS newUserCount 
    FROM student 
    WHERE date >= '${startDate}' AND date < '${endDate}'
  `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching new user count:', err);
      res.status(500).json({ error: 'Failed to fetch new user count' });
    } else {
      const newUserCount = results[0].newUserCount;
      res.json({ count: newUserCount });
    }
  });
});

app.get('/totalUsers', (req, res) => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // Adding 1 because getMonth() returns zero-based index
  const currentYear = currentDate.getFullYear();

  const query = `
    SELECT COUNT(*) AS total_users 
    FROM student 
    WHERE MONTH(date) != ? OR YEAR(date) != ?;
  `;

  connection.query(query, [currentMonth, currentYear], (err, results) => {
    if (err) {
      console.error('Error executing query: ', err);
      res.status(500).send('Error fetching data');
      return;
    }

    const totalUsers = results[0].total_users;
    res.send({ totalUsers });
  });
});


app.get('/MaxUsers', (req, res) => {
  const query = 'SELECT COUNT(*) AS maxUsers FROM student';

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error executing query: ', err);
      res.status(500).send('Error fetching data');
      return;
    }

    const maxUsers = results[0].maxUsers;
    res.json({ maxUsers });
  });
});


app.get('/new-count', (req, res) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // Months are zero-based in JavaScript

  // Construct the start and end dates of the current month
  const startDate = `${currentYear}-${currentMonth}-01`;
  const endDate = `${currentYear}-${currentMonth + 1}-01`; // Next month's 1st day

  // Query to count new users registered in the current month
  const query = `
    SELECT COUNT(*) AS newUserCount 
    FROM teacher 
    WHERE date >= '${startDate}' AND date < '${endDate}'
  `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching new user count:', err);
      res.status(500).json({ error: 'Failed to fetch new user count' });
    } else {
      const newUserCount = results[0].newUserCount;
      res.json({ count: newUserCount });
    }
  });
});

app.get('/allUsers', (req, res) => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // Adding 1 because getMonth() returns zero-based index
  const currentYear = currentDate.getFullYear();

  const query = `
    SELECT COUNT(*) AS total_users 
    FROM teacher 
    WHERE MONTH(date) != ? OR YEAR(date) != ?;
  `;

  connection.query(query, [currentMonth, currentYear], (err, results) => {
    if (err) {
      console.error('Error executing query: ', err);
      res.status(500).send('Error fetching data');
      return;
    }

    const totalUsers = results[0].total_users;
    res.send({ totalUsers });
  });
});


app.get('/totalsUsers', (req, res) => {
  const query = 'SELECT COUNT(*) AS maxUsers FROM teacher';

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error executing query: ', err);
      res.status(500).send('Error fetching data');
      return;
    }

    const maxUsers = results[0].maxUsers;
    res.json({ maxUsers });
  });
});

app.get('/admin_home', (req, res) => {
  res.render('admin_home');
});


// Function to fetch data from the student table and log user count for each date
function logUserCountByDate() {
  const query = 'SELECT date, COUNT(*) AS user_count FROM student GROUP BY date';
  connection.query(query, (err, results) => {
      if (err) {
          console.error('Error fetching data from database:', err);
      } else {
          console.log('User count by date:');
          let previousDate = null;
          results.forEach(row => {
              if (row.date !== previousDate) {
                  console.log(`Date: ${row.date}, User Count: ${row.user_count}`);
              }
              previousDate = row.date;
          });
      }
  });
}

// Call the function to log user count by date
logUserCountByDate();

// Export the function if needed
module.exports = { logUserCountByDate };

function getUserCountByDate(callback) {
    const query = 'SELECT date, COUNT(*) AS user_count FROM student GROUP BY date';
    // Assuming you have your database connection and query function here
    connection.query(query, (err, results) => {
        if (err) {
            callback(err, null);
        } else {
            const data = results.map(row => ({ date: row.date, user_count: row.user_count }));
            callback(null, data);
        }
    });
}

app.use(express.static('public'));

// Assume you have already set up your Express app and MySQL connection

// Route to fetch data from the database for a specified week
app.get('/data', (req, res) => {
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;
  const query = `SELECT date, COUNT(*) AS user_count FROM student WHERE date BETWEEN '${startDate}' AND '${endDate}' GROUP BY date`;
  
  connection.query(query, (err, results) => {
      if (err) {
          console.error('Error fetching data from database:', err);
          res.status(500).json({ error: 'Error fetching data from database' });
      } else {
          res.json(results);
      }
  });
});


// Function to fetch data from the student table and log user count for each date
function logUserCountByDate() {
  const query = 'SELECT date, COUNT(*) AS user_count FROM student GROUP BY date';
  connection.query(query, (err, results) => {
      if (err) {
          console.error('Error fetching data from database:', err);
      } else {
          console.log('User count by date:');
          let previousDate = null;
          results.forEach(row => {
              if (row.date !== previousDate) {
                  console.log(`Date: ${row.date}, User Count: ${row.user_count}`);
              }
              previousDate = row.date;
          });
      }
  });
}

// Call the function to log user count by date
logUserCountByDate();

// Export the function if needed
module.exports = { logUserCountByDate };

function getUserCountByDate(callback) {
    const query = 'SELECT date, COUNT(*) AS user_count FROM student GROUP BY date';
    // Assuming you have your database connection and query function here
    connection.query(query, (err, results) => {
        if (err) {
            callback(err, null);
        } else {
            const data = results.map(row => ({ date: row.date, user_count: row.user_count }));
            callback(null, data);
        }
    });
}

app.use(express.static('public'));

// Assume you have already set up your Express app and MySQL connection

// Route to fetch data from the database for a specified week
app.get('/data', (req, res) => {
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;
  const query = `SELECT date, COUNT(*) AS user_count FROM student WHERE date BETWEEN '${startDate}' AND '${endDate}' GROUP BY date`;
  
  connection.query(query, (err, results) => {
      if (err) {
          console.error('Error fetching data from database:', err);
          res.status(500).json({ error: 'Error fetching data from database' });
      } else {
          res.json(results);
      }
  });
});

// Function to fetch data from the teacher table and log teacher count for each date
function logTeacherCountByDate() {
  const query = 'SELECT date, COUNT(*) AS teacher_count FROM teacher GROUP BY date';
  connection.query(query, (err, results) => {
      if (err) {
          console.error('Error fetching teacher data from database:', err);
      } else {
          console.log('Teacher count by date:');
          let previousDate = null;
          results.forEach(row => {
              if (row.date !== previousDate) {
                  console.log(`Date: ${row.date}, Teacher Count: ${row.teacher_count}`);
              }
              previousDate = row.date;
          });
      }
  });
}

// Call the function to log teacher count by date
logTeacherCountByDate();

// Export the function if needed
module.exports = { logTeacherCountByDate };

// Route to fetch teacher data from the database for a specified week
app.get('/teacherData', (req, res) => {
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;
  const query = `SELECT date, COUNT(*) AS teacher_count FROM teacher WHERE date BETWEEN '${startDate}' AND '${endDate}' GROUP BY date`;
  
  connection.query(query, (err, results) => {
      if (err) {
          console.error('Error fetching teacher data from database:', err);
          res.status(500).json({ error: 'Error fetching teacher data from database' });
      } else {
          res.json(results);
      }
  });
});

app.get('/developer', (req, res) => {
  try {
      // Query the MySQL database to get the total number of users
      connection.query('SELECT COUNT(*) AS totalUsers FROM university', (error, countResult) => {
          if (error) {
              console.error('Error fetching total number of users:', error);
              res.status(500).send('Internal Server Error');
              return;
          }
          
          const totalUsers = countResult[0].totalUsers;

          // Query the MySQL database to get student data
          connection.query('SELECT * FROM university', (error, studentResult) => {
              if (error) {
                  console.error('Error executing MySQL query:', error);
                  res.status(500).send('Internal Server Error');
                  return;
              }
              
              // Render the 'student.ejs' page and pass the query results
              res.render('developer', { data: studentResult, totalUsers: totalUsers, title: 'File Status' });
          });
      });
  } catch (err) {
      console.error('Error handling MySQL query:', err);
      res.status(500).send('Internal Server Error');
  }
});

// Handle other routes...

// Serve the student.html file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'developer.html'));
});
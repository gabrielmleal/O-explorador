/**
 * Home Controller
 * Handles basic home and info routes for the Explorador Web App
 */

const homeController = {
  /**
   * Render the home page
   */
  getHome: (req, res) => {
    try {
      res.render('home.html', {
        title: 'Explorador Web App - Home',
        content: 'Welcome to the Explorador Web Application! This is the foundation for user authentication and profile management.'
      });
    } catch (error) {
      console.error('Error rendering home page:', error);
      res.status(500).json({ error: 'Failed to load home page' });
    }
  },

  /**
   * Render the about page
   */
  getAbout: (req, res) => {
    try {
      res.render('about.html', {
        title: 'About - Explorador Web App',
        content: 'This is a Node.js/Express.js web application built as part of a sequential task implementation test.'
      });
    } catch (error) {
      console.error('Error rendering about page:', error);
      res.status(500).json({ error: 'Failed to load about page' });
    }
  }
};

module.exports = homeController;
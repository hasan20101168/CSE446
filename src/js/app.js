App = {
    webProvider: null,
    contracts: {},
    account: '0x0',
  
    // Initialization function
    init: async function() {
      await App.initWeb();
    },
  
    // Initialize Web3 provider
    initWeb: async function() {
      // If an Ethereum provider instance is already provided by MetaMask
      const provider = window.ethereum;
      if (provider) {
        App.webProvider = provider;
      } else {
        $("#loader-msg").html('No MetaMask Ethereum provider found');
        console.log('No Ethereum provider');
        App.webProvider = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
      }
  
      await App.initContract();
    },
  
    // Initialize the contract
    initContract: async function() {
      // Load the contract ABI and contract address
      const response = await fetch("PatientManagement.json");
      const patientManagement = await response.json();
      
      // Instantiate a new Truffle contract
      App.contracts.PatientManagement = TruffleContract(patientManagement);
      
      // Set provider for the contract
      App.contracts.PatientManagement.setProvider(App.webProvider);
  
      // Set up event listeners
      App.listenForEvents();
  
      await App.render();
    },
  
    // Render function to load patient data and statistics
    render: async function() {
      const loader = $("#loader");
      const content = $("#content");
  
      loader.show();
      content.hide();
  
      // Load account data
      if (window.ethereum) {
        try {
          // Request user to connect to MetaMask
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          App.account = accounts[0];
          $("#accountAddress").text("Your Account: " + App.account);
        } catch (error) {
          if (error.code === 4001) {
            // User rejected request
            console.warn('User rejected');
          }
          $("#accountAddress").text("Your Account: Not Connected");
          console.error(error);
        }
      }
  
      // Load contract data
      try {
        const patientInstance = await App.contracts.PatientManagement.deployed();
  
        // Display Covid trend data
        await App.displayCovidTrendData(patientInstance);
  
        loader.hide();
        content.show();
      } catch (error) {
        console.warn(error);
      }
    },
  
    // Display Covid trend data
    displayCovidTrendData: async function(patientInstance) {
      // Fetch Covid trend data
      try {
        const averageDeathRate = await patientInstance.getAverageDeathRatePerDay();
        const highestCovidDistrict = await patientInstance.getDistrictWithHighestCovidPatients();
        const medianAge = await patientInstance.getMedianAgePerDistrict();
        const percentages = await patientInstance.getPatientAgeGroupPercentages();
  
        // Display the data in the HTML elements
        $("#averageDeathRate").text(averageDeathRate.toString());
        $("#highestCovidDistrict").text(highestCovidDistrict);
        $("#medianAge").text(medianAge.toString());
        $("#childrenPercentage").text(percentages.childrenPercentage.toString() + "%");
        $("#teenagersPercentage").text(percentages.teenagersPercentage.toString() + "%");
        $("#youngPercentage").text(percentages.youngPercentage.toString() + "%");
        $("#elderPercentage").text(percentages.elderPercentage.toString() + "%");
      } catch (error) {
        console.error("Error fetching Covid trend data:", error);
      }
    },
  
    // Function to add patient data
    addPatient: async function() {
      // Get form data
      const patientId = $("#patientId").val();
      const name = $("#name").val();
      const age = parseInt($("#age").val());
      const gender = $("#gender").val();
      const vaccineStatus = $("#vaccineStatus").val();
      const district = $("#district").val();
      const symptoms = $("#symptoms").val();
  
      try {
        const patientInstance = await App.contracts.PatientManagement.deployed();
        await patientInstance.addPatientData(patientId, name, age, gender, vaccineStatus, district, symptoms);
        alert("Patient registered successfully!");
        $("#patientForm").trigger("reset");
      } catch (error) {
        console.error("Error adding patient data:", error);
        alert("An error occurred while adding patient data.");
      }
    },
  
    // Function to update patient data
    updatePatient: async function() {
      // Get form data
      const patientId = $("#updatePatientId").val();
      const vaccineStatus = $("#updateVaccineStatus").val();
      const isDead = $("#isDead").val() === "true";
  
      try {
        const patientInstance = await App.contracts.PatientManagement.deployed();
        await patientInstance.updatePatientData(patientId, vaccineStatus, isDead);
        alert("Patient data updated successfully!");
        $("#updateForm").trigger("reset");
        // Refresh Covid trend data
        await App.displayCovidTrendData(patientInstance);
      } catch (error) {
        console.error("Error updating patient data:", error);
        alert("An error occurred while updating patient data.");
      }
    },
  
    // Function to download vaccine certificate
    downloadCertificate: async function() {
      // Get patient ID from the form
      const patientId = $("#certificatePatientId").val();
  
      try {
        const patientInstance = await App.contracts.PatientManagement.deployed();
        const vaccineStatus = await patientInstance.getPatientVaccineStatus(patientId);
  
        if (vaccineStatus === "two_dose") {
          // Display a certificate message as an alert (simulating certificate download)
          alert(`Vaccine Certificate for Patient ID: ${patientId}\nVaccine Status: ${vaccineStatus}`);
        } else {
          alert("Patient is not fully vaccinated or not found.");
        }
      } catch (error) {
        console.error("Error fetching vaccine certificate:", error);
        alert("An error occurred while fetching vaccine certificate.");
      }
    },
  
    // Event listeners for contract events
    listenForEvents: function() {
      App.contracts.PatientManagement.deployed().then(function(instance) {
        instance.PatientAdded({}, {
          fromBlock: 0,
          toBlock: "latest"
        }).on("data", function(event) {
          console.log("Patient Added Event Triggered:", event);
          // Reload the page to reflect new data
          App.render();
        }).on("error", function(err) {
          console.error(err);
        });
  
        instance.PatientUpdated({}, {
          fromBlock: 0,
          toBlock: "latest"
        }).on("data", function(event) {
          console.log("Patient Updated Event Triggered:", event);
          // Reload the page to reflect updated data
          App.render();
        }).on("error", function(err) {
          console.error(err);
        });
      });
    },
  };
  
  $(function() {
    $(window).load(function() {
      App.init();
    });
  });
  
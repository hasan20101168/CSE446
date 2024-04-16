window.addEventListener('load', async () => {
    // Initialize web3
    if (window.ethereum) {
        window.web3 = new Web3(window.ethereum);
        try {
            // Request account access
            await window.ethereum.enable();
        } catch (error) {
            console.error('User denied account access...');
        }
    } else {
        console.error('Non-Ethereum browser detected. You should consider trying MetaMask!');
    }

    const contractAddress = '0xD136fD8aAa36e87099FFD9ECb5B0aF6D6b97cAAB';
    const abi = [
        {
            "inputs": [],
            "stateMutability": "nonpayable",
            "type": "constructor"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "uint256",
                    "name": "id",
                    "type": "uint256"
                },
                {
                    "indexed": false,
                    "internalType": "string",
                    "name": "name",
                    "type": "string"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "age",
                    "type": "uint256"
                },
                {
                    "indexed": false,
                    "internalType": "string",
                    "name": "gender",
                    "type": "string"
                },
                {
                    "indexed": false,
                    "internalType": "bool",
                    "name": "vaccineStatus",
                    "type": "bool"
                },
                {
                    "indexed": false,
                    "internalType": "string",
                    "name": "district",
                    "type": "string"
                },
                {
                    "indexed": false,
                    "internalType": "string",
                    "name": "symptomsDetails",
                    "type": "string"
                },
                {
                    "indexed": false,
                    "internalType": "bool",
                    "name": "isDead",
                    "type": "bool"
                }
            ],
            "name": "PatientAdded",
            "type": "event"
        },
        {
            "inputs": [
                {
                    "internalType": "string",
                    "name": "_name",
                    "type": "string"
                },
                {
                    "internalType": "uint256",
                    "name": "_age",
                    "type": "uint256"
                },
                {
                    "internalType": "string",
                    "name": "_gender",
                    "type": "string"
                },
                {
                    "internalType": "bool",
                    "name": "_vaccineStatus",
                    "type": "bool"
                },
                {
                    "internalType": "string",
                    "name": "_district",
                    "type": "string"
                },
                {
                    "internalType": "string",
                    "name": "_symptomsDetails",
                    "type": "string"
                },
                {
                    "internalType": "bool",
                    "name": "_isDead",
                    "type": "bool"
                }
            ],
            "name": "addPatient",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "_id",
                    "type": "uint256"
                }
            ],
            "name": "getPatient",
            "outputs": [
                {
                    "internalType": "struct PatientRegistry.Patient",
                    "name": "",
                    "type": "tuple",
                    "components": [
                        {
                            "internalType": "uint256",
                            "name": "id",
                            "type": "uint256"
                        },
                        {
                            "internalType": "string",
                            "name": "name",
                            "type": "string"
                        },
                        {
                            "internalType": "uint256",
                            "name": "age",
                            "type": "uint256"
                        },
                        {
                            "internalType": "string",
                            "name": "gender",
                            "type": "string"
                        },
                        {
                            "internalType": "bool",
                            "name": "vaccineStatus",
                            "type": "bool"
                        },
                        {
                            "internalType": "string",
                            "name": "district",
                            "type": "string"
                        },
                        {
                            "internalType": "string",
                            "name": "symptomsDetails",
                            "type": "string"
                        },
                        {
                            "internalType": "bool",
                            "name": "isDead",
                            "type": "bool"
                        }
                    ]
                }
            ],
            "stateMutability": "view",
            "type": "function"
        }
    ];

    const contract = new web3.eth.Contract(abi, contractAddress);

    // Form and statisticsTable div
    const patientForm = document.getElementById('patientForm');
    const statisticsTableDiv = document.getElementById('statisticsTable');

    // Handle form submission
    patientForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Get form values
        const name = event.target.name.value;
        const age = parseInt(event.target.age.value);
        const gender = event.target.gender.value;
        const vaccineStatus = event.target.vaccineStatus.value === "true";
        const district = event.target.district.value;
        const symptomsDetails = event.target.symptomsDetails.value;
        const isDead = event.target.isDead.value === "true";
        const dateAdded = Math.floor(Date.now() / 1000); // Unix timestamp

        // Get accounts
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        const account = accounts[0];

        // Call the smart contract function to add patient data
        try {
            await contract.methods.addPatient(
                name,
                age,
                gender,
                vaccineStatus,
                district,
                symptomsDetails,
                isDead,
                dateAdded
            ).send({ from: account });

            // Reset form
            patientForm.reset();

            // Update statistics table
            updateStatisticsTable();

        } catch (error) {
            console.error('Error adding patient:', error);
        }
    });

    // Function to update statistics table
    async function updateStatisticsTable() {
        // Initialize statistics
        const districtPatientCount = {};
        const districtAgeSum = {};
        const districtDeathCount = {};
        const ageGroups = {
            children: 0,
            teenagers: 0,
            young: 0,
            elder: 0,
        };
        let totalPatients = 0;
        let totalDeaths = 0;

        // Iterate through all patients in the contract
        const patientCount = await contract.methods.patientCount().call();
        for (let id = 1; id <= patientCount; id++) {
            const patient = await contract.methods.getPatient(id).call();
            const { id: patientId, name, age, gender, vaccineStatus, district, symptomsDetails, isDead } = patient;

            // Update statistics
            totalPatients++;
            if (isDead) {
                totalDeaths++;
            }

            if (!districtPatientCount[district]) {
                districtPatientCount[district] = 0;
                districtAgeSum[district] = 0;
                districtDeathCount[district] = 0;
            }

            districtPatientCount[district]++;
            districtAgeSum[district] += age;
            if (isDead) {
                districtDeathCount[district]++;
            }

            // Update age groups
            if (age < 13) {
                ageGroups.children++;
            } else if (age >= 13 && age < 20) {
                ageGroups.teenagers++;
            } else if (age >= 20 && age < 50) {
                ageGroups.young++;
            } else if (age >= 50) {
                ageGroups.elder++;
            }
        }

        // Calculate average death rate per day
        const averageDeathRatePerDay = totalDeaths / totalPatients;

        // Find district with the highest COVID patient count
        let maxDistrict = '';
        let maxPatientCount = 0;
        for (const district in districtPatientCount) {
            if (districtPatientCount[district] > maxPatientCount) {
                maxPatientCount = districtPatientCount[district];
                maxDistrict = district;
            }
        }

        // Calculate median age of COVID patients in each district
        const districtMedianAge = {};
        for (const district in districtPatientCount) {
            const ages = [];
            for (let id = 1; id <= patientCount; id++) {
                const patient = await contract.methods.getPatient(id).call();
                const { id: patientId, age, district: patientDistrict } = patient;

                if (patientDistrict === district) {
                    ages.push(age);
                }
            }

            // Sort ages and calculate median
            ages.sort((a, b) => a - b);
            const middle = Math.floor(ages.length / 2);
            const median = ages.length % 2 === 0 ? (ages[middle - 1] + ages[middle]) / 2 : ages[middle];
            districtMedianAge[district] = median;
        }

        // Calculate percentage of age groups
        const ageGroupPercentages = {
            children: (ageGroups.children / totalPatients) * 100,
            teenagers: (ageGroups.teenagers / totalPatients) * 100,
            young: (ageGroups.young / totalPatients) * 100,
            elder: (ageGroups.elder / totalPatients) * 100,
        };

        // Generate statistics table HTML
        let tableHTML = `
            <table border="1">
                <tr>
                    <th>Statistic</th>
                    <th>Value</th>
                </tr>
                <tr>
                    <td>Average Death Rate Per Day</td>
                    <td>${averageDeathRatePerDay.toFixed(2)}</td>
                </tr>
                <tr>
                    <td>District with Highest COVID Patient Count</td>
                    <td>${maxDistrict} (${maxPatientCount} patients)</td>
                </tr>
                <tr>
                    <td>Median Age of COVID Patients in Each District</td>
                    <td>`;
        for (const district in districtMedianAge) {
            tableHTML += `<br>${district}: ${districtMedianAge[district].toFixed(2)} years`;
        }
        tableHTML += `</td>
                </tr>
                <tr>
                    <td>Percentage of Age Groups</td>
                    <td>
                        Children (<13): ${ageGroupPercentages.children.toFixed(2)}%<br>
                        Teenagers (13-19): ${ageGroupPercentages.teenagers.toFixed(2)}%<br>
                        Young (20-49): ${ageGroupPercentages.young.toFixed(2)}%<br>
                        Elder (50+): ${ageGroupPercentages.elder.toFixed(2)}%<br>
                    </td>
                </tr>
            </table>
        `;

        // Display statistics table
        statisticsTableDiv.innerHTML = tableHTML;
    }

    // Initial update of statistics table
    updateStatisticsTable();
});


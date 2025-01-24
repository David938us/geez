import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, arrayUnion } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDlbqYBNyC6KTHIQpTbU0VYS9swEtdP5Qg",
    authDomain: "neww-691d7.firebaseapp.com",
    projectId: "neww-691d7",
    storageBucket: "neww-691d7.appspot.com",
    messagingSenderId: "848254544419",
    appId: "1:848254544419:web:aa99538a76e93a71cb9f96",
    measurementId: "G-SR5K0HQ9F8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Constants
const startupBalance = 0;

// Initialize user balance
async function initializeUserBalance(uid) {
    const userRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
        const userData = docSnap.data();
        if (userData.balance === undefined) {
            await updateDoc(userRef, { balance: startupBalance });
        }
    } else {
        await setDoc(userRef, {
            balance: startupBalance,
            spending: 0,
            over: 0,
            transactions: []
        });
    }
}

// Fetch transaction history
async function fetchTransactionHistory() {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const userRef = doc(db, 'users', currentUser.uid);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
        const userData = docSnap.data();
        const transactions = userData.transactions || [];
        displayTransactionHistory(transactions);
    } else {
        console.error('User data not found');
    }
}

// Display transaction history
function displayTransactionHistory(transactions) {
    const historyContainer = document.getElementById('transactionHistory');
    historyContainer.innerHTML = '';

    transactions.forEach(transaction => {
        const transactionElement = document.createElement('div');
        transactionElement.className = 'transaction';
        transactionElement.innerHTML = `
            <p>Type: ${transaction.type}</p>
            <p>Date: ${new Date(transaction.date).toLocaleString()}</p>
            <p>Status: ${transaction.status}</p>
            <hr>
        `;
        historyContainer.appendChild(transactionElement);
    });
}

// Transfer money
async function transferMoney(toEmail, amount) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        alert('No user is logged in.');
        return;
    }

    const currentUserRef = doc(db, 'users', currentUser.uid);
    const recipientQuery = query(collection(db, 'users'), where('email', '==', toEmail.trim().toLowerCase()));

    try {
        const recipientQuerySnapshot = await getDocs(recipientQuery);
        if (recipientQuerySnapshot.empty) {
            alert('Recipient not found');
            return;
        }

        const recipientDoc = recipientQuerySnapshot.docs[0];
        const recipientRef = doc(db, 'users', recipientDoc.id);
        const currentUserDoc = await getDoc(currentUserRef);

        if (!currentUserDoc.exists()) {
            alert('Current user not found');
            return;
        }

        const currentUserData = currentUserDoc.data();
        if (currentUserData.balance < amount) {
            alert('Insufficient balance');
            return;
        }

        // Perform transfer
        await updateDoc(currentUserRef, {
            balance: currentUserData.balance - amount,
            spending: currentUserData.spending + amount
        });
        await updateDoc(recipientRef, {
            balance: recipientDoc.data().balance + amount,
            spending: recipientDoc.data().spending - amount
        });

        // Record transactions
        const senderTransaction = {
            type: 'Sent',
            amount: -amount,
            date: new Date().toISOString(),
            status: 'Completed'
        };

        const recipientTransaction = {
            type: 'Received',
            amount,
            date: new Date().toISOString(),
            status: 'Completed'
        };

        await updateDoc(currentUserRef, { transactions: arrayUnion(senderTransaction) });
        await updateDoc(recipientRef, { transactions: arrayUnion(recipientTransaction) });

        alert('Transfer successful');
        fetchTransactionHistory();
        displayBalance();
    } catch (error) {
        console.error('Transfer failed: ', error.message);
    }
}

// Display balance
function displayBalance() {
    const currentUser = auth.currentUser;
    const balanceElement = document.getElementById('balance');

    if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        getDoc(userRef).then((docSnap) => {
            if (docSnap.exists()) {
                const userData = docSnap.data();
                const formattedBalance = `$${userData.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
                balanceElement.textContent = formattedBalance;
                document.getElementById("balancee").innerText = formattedBalance;
            }
        }).catch((error) => {
            console.error("Error fetching user data:", error);
        });
    }
}

// Sidebar setup
function setupSideNav() {
    const sidenav = document.getElementById('sidenav');
    const sidenavOpen = document.getElementById('sidenavOpen');
    const sidenavClose = document.getElementById('sidenavClose');

    if (sidenav && sidenavOpen && sidenavClose) {
        sidenavOpen.addEventListener('click', () => {
            sidenav.style.width = '250px';
        });

        sidenavClose.addEventListener('click', () => {
            sidenav.style.width = '0';
        });
    }
}

// Handle account fetching
async function fetchAccounts() {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const userRef = doc(db, 'users', currentUser.uid);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
        const userData = docSnap.data();
        const accounts = userData.accounts || [];
        const accountsContainer = document.getElementById('accountsContainer');
        accountsContainer.innerHTML = '';

        accounts.forEach(account => {
            const accountElement = document.createElement('div');
            accountElement.className = 'account';
            accountElement.innerHTML = `
                <p>Account: ${account.name}</p>
                <p>Balance: $${account.balance.toFixed(2)}</p>
                <hr>
            `;
            accountsContainer.appendChild(accountElement);
        });
    } else {
        console.error('User accounts not found');
    }
}

// Initialize onAuthStateChanged
onAuthStateChanged(auth, async (user) => {
    if (user) {
        await initializeUserBalance(user.uid);
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.firstName) {
                document.getElementById('usernameDisplay').textContent = userData.firstName;
            }
            displayBalance();
            fetchTransactionHistory();
        } else {
            console.error('User document not found');
        }
    } else {
        window.location.href = 'login';
    }
});



// + New Account Button Functionality
const btnNewAccount = document.querySelectorAll('.btn-new');
btnNewAccount.forEach(button => {
    button.addEventListener('click', async () => {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            alert("You must be logged in to create a new account.");
            return;
        }

        const accountName = prompt("Enter new account name:");
        if (accountName) {
            try {
                const userRef = doc(db, 'users', currentUser.uid);
                await updateDoc(userRef, {
                    accounts: arrayUnion({ name: accountName, balance: 0 })
                }).then(() => {
                    // Refresh the page or update the UI to reflect the new account
                    fetchAccounts();
                });
            } catch (error) {
                console.error("Error creating new account:", error);
            }
        }
    });
});

// Function to fetch and display accounts (assumed to be in Firestore)

// Fetch accounts on page load
onAuthStateChanged(auth, async (user) => {
    if (user) {
        fetchAccounts();
    }
});

// Credit Score Chart Display
const creditScoreElement = document.querySelectorAll('.dashboard-item .title[title="My Credit Score"]');
creditScoreElement.forEach(element => {
    element.addEventListener('click', async () => {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            alert("You must be logged in to view your credit score.");
            return;
        }

        const userRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
            const userData = docSnap.data();
            const creditScore = userData.creditScore || [700, 710, 720, 730, 740]; // Default example data

            const creditScoreChartElement = document.getElementById('creditScoreChart');
            if (creditScoreChartElement) {
                const ctx = creditScoreChartElement.getContext('2d');
                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
                        datasets: [{
                            label: 'Credit Score',
                            data: creditScore,
                            borderColor: 'rgba(75, 192, 192, 1)',
                            fill: false
                        }]
                    }
                });
            }

            // Show the chart modal
            document.getElementById('creditScoreModal').style.display = 'block';
        } else {
            console.error('User data not found for credit score');
        }
    });
});

// Spending Analysis Chart Display
const spendingAnalysisElement = document.querySelectorAll('.dashboard-item .title[title="Spending Analysis"]');
spendingAnalysisElement.forEach(element => {
    element.addEventListener('click', async () => {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            alert("You must be logged in to view your spending analysis.");
            return;
        }

        const userRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
            const userData = docSnap.data();
            const spendingData = userData.spendingData || [100, 200, 150, 250, 300]; // Default example data

            const spendingChartElement = document.getElementById('spendingChart');
            if (spendingChartElement) {
                const ctx = spendingChartElement.getContext('2d');
                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
                        datasets: [{
                            label: 'Spending ($)',
                            data: spendingData,
                            backgroundColor: 'rgba(255, 99, 132, 0.2)',
                            borderColor: 'rgba(255, 99, 132, 1)',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });
            }

            // Show the chart modal
            document.getElementById('spendingModal').style.display = 'block';
        } else {
            console.error('User data not found for spending analysis');
        }
    });
});

// Close modal functionality
const closeCreditScoreModal = document.getElementById('closeCreditScoreModal');
const closeSpendingModal = document.getElementById('closeSpendingModal');

closeCreditScoreModal.addEventListener('click', () => {
    document.getElementById('creditScoreModal').style.display = 'none';
});

closeSpendingModal.addEventListener('click', () => {
    document.getElementById('spendingModal').style.display = 'none';
});

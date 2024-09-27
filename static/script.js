import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, arrayUnion } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";




// Your web app's Firebase configuration
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

const startupBalance = 0;

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

async function fetchTransactionHistory() {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        return;
    }

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

function displayTransactionHistory(transactions) {
    const historyContainer = document.getElementById('transactionHistory');
    historyContainer.innerHTML = ''; // Clear previous content

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

        // Perform the transfer
        await updateDoc(currentUserRef, {
            balance: currentUserData.balance - amount,
            spending: currentUserData.spending + amount // Track spending as positive
        });
        await updateDoc(recipientRef, {
            balance: recipientDoc.data().balance + amount,
            spending: recipientDoc.data().spending - amount // Track spending as negative
        });

        // Record the transaction
        const senderTransaction = {
            type: 'Sent',
            amount: -amount, // Negative amount for sender
            date: new Date().toISOString(),
            status: 'Completed'
        };

        const recipientTransaction = {
            type: 'Received',
            amount: amount, // Positive amount for recipient
            date: new Date().toISOString(),
            status: 'Completed'
        };

        await updateDoc(currentUserRef, { transactions: arrayUnion(senderTransaction) });
        await updateDoc(recipientRef, { transactions: arrayUnion(recipientTransaction) });

        alert('Transfer successful');
        displayTransactionHistory();
        displayOverallSpending();
        displayBalance();
        calculateTotalIncome(userData.transactions);
        calculateTotalExpenses(userData.transactions);
    } catch (error) {
        console.log('Transfer failed: ' + error.message);
    }
}

function calculateTotalIncome(transactions) {
    let totalIncome = 0;

    transactions.forEach(transaction => {
        if (transaction.amount > 0) {
            totalIncome += transaction.amount;
        }
    });

    const totalIncomeElement = document.getElementById('totalincome');
    if (totalIncomeElement) {
        totalIncomeElement.textContent = `$${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
}

function calculateTotalExpenses(transactions) {
    let totalExpenses = 0;

    transactions.forEach(transaction => {
        if (transaction.amount < 0) {
            totalExpenses += Math.abs(transaction.amount); // Convert negative amounts to positive
        }
    });

    const totalExpensesElement = document.getElementById('totalexpense');
    if (totalExpensesElement) {
        totalExpensesElement.textContent = `$${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
}



function displayBalance() {
    const currentUser = auth.currentUser;
    const balanceElement = document.getElementById('balance');
    
    if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        getDoc(userRef).then((docSnap) => {
            if (docSnap.exists()) {
                const userData = docSnap.data();
                balanceElement.textContent = `$${userData.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
               document.getElementById("balancee").innerText = `$${userData.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            }
        }).catch((error) => {
            console.error("Error fetching user data:", error);
        });
    }
}

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

// Initialize user balance and other functionalities on auth state change
onAuthStateChanged(auth, async (user) => {
    if (user) {
        await initializeUserBalance(user.uid);

        // Retrieve the user's first name from Firestore
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        

        if (userDoc.exists()) {
            const userData = userDoc.data();

            // Set the user's first name to the username display element
            if (userData.firstName) {
                document.getElementById('usernameDisplay').textContent = userData.firstName;
            }

            // Call other functions to display user data
           
            displayBalance();
            fetchTransactionHistory();
            
        } else {
            console.error('User document not found');
        }
    } else {
        window.location.href = 'login';
    }
});




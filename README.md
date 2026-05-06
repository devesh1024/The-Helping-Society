# The-Helping-SocietyV2 🤝

Welcome to **The-Helping-SocietyV2** – a dedicated community platform designed to connect people, share educational resources, and foster a collaborative environment.

## 🌟 Overview

The-Helping-SocietyV2 is a modern web application built to streamline resource sharing and community management. Whether you're a student looking for study materials, a professor sharing knowledge, or a community member looking to help out, The-Helping-SocietyV2 provides the infrastructure to make it happen safely and efficiently.

## ✨ Key Features

- **Resource Sharing**: Upload, share, and discover educational resources categorized by subject, year, semester, and branch.
- **Role-Based Access Control**: Secure platform with multiple user tiers including regular Users, Khabris, Professors, Admins, and Super Admins.
- **Admin Dashboard**: Comprehensive moderation tools to verify users, manage content approvals (approve/reject resources), and maintain community guidelines.
- **Audit Logging**: Transparent tracking of all administrative actions (approvals, bans, verifications) to ensure accountability.
- **Secure Authentication**: Passwordless or standard login powered by Supabase.

## 🛠️ Technology Stack

- **Frontend**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage)
- **Icons**: [Lucide React](https://lucide.dev/)

## 🚀 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) and npm installed on your local machine. You will also need a Supabase project set up.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/devesh1024/the-helping-society-v2.git
   cd the-helping-society-v2
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env` file in the root directory based on the `.env.example` file and add your Supabase credentials:
   ```env
   VITE_SUPABASE_PROJECT_ID="your_project_id"
   VITE_SUPABASE_URL="https://your_project_id.supabase.co"
   VITE_SUPABASE_PUBLISHABLE_KEY="your_anon_public_key"
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:8080](http://localhost:8080) to view it in your browser.

## 🛡️ Security Note
Never commit your `.env` file or expose your Supabase `service_role` key in the frontend. Always use the `anon` public key for `VITE_SUPABASE_PUBLISHABLE_KEY`.

---
*Built with ❤️ for the community.*

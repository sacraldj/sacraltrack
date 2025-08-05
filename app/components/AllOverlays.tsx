"use client"

import { useGeneralStore } from "../stores/general";
import Login from "./auth/Login";
import Register from "./auth/Register";
import EditProfileOverlay from "./profile/EditProfileOverlay";
import ClientOnly from "./ClientOnly";
import { AnimatePresence } from "framer-motion";
import CookieConsentPopup from "./CookieConsentPopup";
//import { RecoilRoot } from "recoil";

export default function AllOverlays() {
    const { isLoginOpen, isRegisterOpen, isEditProfileOpen } = useGeneralStore();
    
    return (
        <ClientOnly>
            <AnimatePresence mode="wait">
                {isLoginOpen && <Login key="login" />}
                {isRegisterOpen && <Register key="register" />}
                {isEditProfileOpen && <EditProfileOverlay key="edit-profile" />}
            </AnimatePresence>
            <CookieConsentPopup />
        </ClientOnly>
    );
}

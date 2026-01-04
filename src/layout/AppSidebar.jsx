import { useCallback, useEffect, useRef, useState, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

// Assume these icons are imported from an icon library
import {
  BoxCubeIcon,
  CalenderIcon,
  ChevronDownIcon,
  GridIcon,
  MoreDotIcon,
  ListIcon,
  PageIcon,
  PieChartIcon,
  PlugInIcon,
  TableIcon,
  UserCircleIcon,
  SettingsIcon,
  UserIcon,
  ShootingStarIcon,
  MailIcon,
  CalendarIcon,
  GroupIcon
} from "../icons";
import { useSidebar } from "../context/SidebarContext";
import SidebarWidget from "./SidebarWidget";
import { isManager, hasRole, isAccountant, isCounsellor, isAdmin } from "../utils/roleHelpers";


const navItems = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    subItems: [{ name: "Leads & Conversions", path: "/", pro: false },
    { name: "Student Performance (beta)", path: "/students-overview", pro: false },
    { name: "Revenue Snapshot (beta)", path: "/revenue-overview", pro: false }
    ],
  },
  {
    name: "Lead Management",
    icon: <ListIcon />,
    subItems: [
      { name: "New Lead", path: "/new-lead", pro: false },
      { name: "Manage Leads", path: "/lead-management", pro: false },
    ],
  },
  {
    name: "Student Management",
    icon: <UserIcon />,
    subItems: [
      { name: "New Student (beta)", path: "/new-student", pro: false },
      { name: "Manage Students (beta)", path: "/manage-students", pro: false },
      { name: "Batch Management", path: "/batch-management", pro: false },
    ],
  },
  {
    name: "Finance",
    icon: <TableIcon />,
    subItems: [
      { name: "Collect Payment", path: "/finance/collect-payment", pro: false },
    ]
  },
  {
    icon: <CalendarIcon />,
    name: "Calendar",
    path: "/calendar"
  },
  {
    icon: <GroupIcon />,
    name: "Events",
    subItems: [
      { name: "Create Event", path: "/events/create", pro: false },
      { name: "Manage Events", path: "/events", pro: false }
    ]
  },
  {
    icon: <GroupIcon />,
    name: "Leave Management",
    subItems: [
      { name: "Apply Leave", path: "/leave-management/apply", pro: false },
      { name: "My Leaves", path: "/leave-management/my-leaves", pro: false },
      { name: "Manage Leaves", path: "/leave-management", pro: false },
    ]
  },
  { icon: <MailIcon />, name: "Email", path: "/email" },
  {
    name: "Operations",
    icon: <PageIcon />,
    subItems: [
      { name: "Blank Page", path: "/blank", pro: false },
      { name: "404 Error", path: "/error-404", pro: false },
    ],
  },
];

const othersItems = [
  // {
  //   icon: <PieChartIcon />,
  //   name: "Charts",
  //   subItems: [
  //     { name: "Line Chart", path: "/line-chart", pro: false },
  //     { name: "Bar Chart", path: "/bar-chart", pro: false },
  //   ],
  // },
  { icon: <ShootingStarIcon />, name: "Marketing Materials", path: "/marketing-materials" },
  { icon: <ShootingStarIcon />, name: "Course Curriculum", path: "/course-curriculum" },
  {
    icon: <BoxCubeIcon />,
    name: "UI Elements",
    subItems: [
      { name: "Alerts", path: "/alerts", pro: false },
      { name: "Avatar", path: "/avatars", pro: false },
      { name: "Badge", path: "/badge", pro: false },
      { name: "Buttons", path: "/buttons", pro: false },
      { name: "Images", path: "/images", pro: false },
      { name: "Videos", path: "/videos", pro: false },
    ],
  }
];

const settingsItems = [
  {
    icon: <SettingsIcon />,
    name: "Settings",
    subItems: [
      // { name: "Sign In", path: "/signin", pro: false },
      // { name: "Sign Up", path: "/signup", pro: false },
      { name: "Edit Profile", path: "/profile", pro: false },
      { name: "Campaigns", path: "/settings/campaigns", pro: false },
      { name: "Contact Points", path: "/settings/contact-points", pro: false },
      { name: "Course Management", path: "/settings/courses", pro: false },
      { name: "User Management", path: "/settings/users", pro: false },
      { name: "Brand Management", path: "/settings/brands", pro: false },
      { name: "Announcements", path: "/settings/announcements", pro: false }
    ],
  }
];

const AppSidebar = () => {
  const { user, selectedBrand } = useContext(AuthContext);
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();

  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [subMenuHeight, setSubMenuHeight] = useState({});
  const subMenuRefs = useRef({});

  const isActive = useCallback(
    (path) => location.pathname === path,
    [location.pathname]
  );

  useEffect(() => {
    let submenuMatched = false;
    ["main", "others", "settings"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : menuType === "settings" ? settingsItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({ type: menuType, index });
              submenuMatched = true;
            }
          });
        }
      });
      if (submenuMatched) return;
    });

    if (!submenuMatched) setOpenSubmenu(null);
  }, [location, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prev) => ({
          ...prev,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  useEffect(() => {
    // Force close submenus if brand is deselected and they are not global
    if (!selectedBrand) {
      // Logic could be added here if needed, but the disabled state handles the UX
    }
  }, [selectedBrand]);

  const handleSubmenuToggle = (index, menuType) => {
    setOpenSubmenu((prev) =>
      prev && prev.type === menuType && prev.index === index
        ? null
        : { type: menuType, index }
    );
  };

  // Check if user has manager privileges (Owner, Academic Coordinator, Brand Manager)
  const hasManagerAccess = isManager(user);

  // Helper to determine if an item is global (always accessible)
  const isGlobalItem = (name) => {
    // Settings category itself should be clickable to reveal subitems
    if (name === "Settings") return true;

    // Whitelisted Global Modules
    const globalModules = [
      "User Management",
      "Brand Management",
      "Edit Profile",
      "Sign In", // If present
      "Sign Up",  // If present
      "Dashboard",
      "Leads & Conversions",
      "Student Performance (beta)",
      "Revenue Snapshot (beta)"
    ];
    return globalModules.includes(name);
  };

  const renderMenuItems = (items, menuType) => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => {
        // Determine if this item or any of its subitems are enabled
        // If it's a parent menu (like Settings), checks if it has AT LEAST ONE enabled child or is itself global
        const isParentEnabled = selectedBrand || isGlobalItem(nav.name) || (nav.subItems && nav.subItems.some(sub => isGlobalItem(sub.name)));

        // Restricted items for Instructor
        // Restricted items for Instructor
        const restrictedItemsForFaculty = [
          "Dashboard",
          "Lead Management",
          // "Student Management", // Allow access to Student Management (specifically Batch Management)
          "Operations",
          "Marketing Materials",
          "UI Elements"
        ];

        if (restrictedItemsForFaculty.includes(nav.name) && hasRole(user, "Instructor") && !hasManagerAccess) {
          return null;
        }

        // Restricted items for Counsellors (who are not managers)
        if (isCounsellor(user) && !isManager(user)) {
          // Counsellors need Lead Management, but not Finance or technical/admin items
          const hiddenForCounsellor = ["Finance", "Operations", "UI Elements"];
          if (hiddenForCounsellor.includes(nav.name)) return null;
        }

        // Restricted items for Academic Coordinator
        if (hasRole(user, "Academic Coordinator")) {
          // AC ONLY needs Student Management and Settings (will filter subitems below)
          const allowedForAC = ["Student Management", "Settings"];
          if (!allowedForAC.includes(nav.name)) return null;
        }

        // Restricted items for Accountants (who are not managers)
        if (isAccountant(user) && !isManager(user)) {
          // Accountants need Finance, but not Lead/Student management (unless for payments, which are in Finance)
          const hiddenForAccountant = [
            "Lead Management",
            "Student Management",
            "Operations",
            "Marketing Materials",
            "Course Curriculum",
            "UI Elements"
          ];
          if (hiddenForAccountant.includes(nav.name)) return null;
        }

        // Special handling for Leave Management sub-items
        if (nav.name === "Leave Management" && nav.subItems) {
          // This filter logic is complex because we are iterating parents here.
          // The subitem filtering happens in the rendering of subitems below.
          // However, if a user has access to NO subitems, we probably shouldn't show the parent?
          // But 'Apply Leave' and 'My Leaves' are usually available to everyone.
          // 'Manage Leaves' is restricted.
          // So the parent 'Leave Management' is valid for everyone.
        }

        // Special handling for Finance (hide for non-accountants/non-managers)
        if (nav.name === "Finance" && !isAccountant(user)) {
          return null;
        }

        // Disable style
        const itemDisabledClass = !isParentEnabled ? "opacity-40 cursor-not-allowed pointer-events-none" : "";

        return (
          <li key={nav.name} className={itemDisabledClass}>
            {nav.subItems ? (
              <button
                onClick={() => isParentEnabled && handleSubmenuToggle(index, menuType)}
                disabled={!isParentEnabled}
                className={`menu-item group ${openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
                  } cursor-pointer ${!isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "lg:justify-start"
                  }`}
                id={`sidebar-item-${nav.name.replace(/\s+/g, '-').toLowerCase()}`}
              >
                {/* ... rest of button ... */}

                <span
                  className={`menu-item-icon-size  ${openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                    }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
                {(isExpanded || isHovered || isMobileOpen) && (
                  <ChevronDownIcon
                    className={`ml-auto w-5 h-5 transition-transform duration-200 ${openSubmenu?.type === menuType &&
                      openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                      }`}
                  />
                )}
              </button>
            ) : (
              nav.path && (
                <Link
                  to={isParentEnabled ? nav.path : "#"}
                  onClick={e => !isParentEnabled && e.preventDefault()}
                  className={`menu-item group ${isActive(nav.path)
                    ? "menu-item-active"
                    : "menu-item-inactive"
                    }`}
                  id={`sidebar-item-${nav.name.replace(/\s+/g, '-').toLowerCase()}`}
                >
                  <span
                    className={`menu-item-icon-size ${isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                      }`}
                  >
                    {nav.icon}
                  </span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className="menu-item-text">{nav.name}</span>
                  )}
                </Link>
              )
            )}
            {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
              <div
                ref={(el) => (subMenuRefs.current[`${menuType}-${index}`] = el)}
                className="overflow-hidden transition-all duration-300"
                style={{
                  height:
                    openSubmenu?.type === menuType && openSubmenu?.index === index
                      ? `${subMenuHeight[`${menuType}-${index}`]}px`
                      : "0px",
                }}
              >
                <ul className="mt-2 space-y-1 ml-9">
                  {nav.subItems.map((subItem) => {
                    // Check if this specific sub-item is enabled
                    const isSubItemEnabled = subItem.name === "Announcements"
                      ? !selectedBrand
                      : (selectedBrand || isGlobalItem(subItem.name));
                    const subItemDisabledClass = !isSubItemEnabled ? "opacity-40 cursor-not-allowed pointer-events-none" : "";

                    // Only show Campaigns, Contact Points, Course Management to managers
                    if ((subItem.name === "Campaigns" || subItem.name === "Contact Points" ||
                      subItem.name === "Course Management") && !hasManagerAccess) {
                      return null;
                    }

                    // RESTRICTION: Academic Coordinator only sees Batch Management and Edit Profile
                    if (hasRole(user, "Academic Coordinator")) {
                      const allowedSubItemsAC = ["Batch Management", "Edit Profile"];
                      if (!allowedSubItemsAC.includes(subItem.name)) {
                        return null;
                      }
                    }

                    // RESTRICTION: Only Owner, HR can see "Manage Leaves"
                    if (subItem.name === "Manage Leaves" && !(hasRole(user, "Owner") || hasRole(user, "HR"))) {
                      return null;
                    }

                    // RESTRICTION: Instructor should only see "Batch Management" under Student Management
                    if (hasRole(user, "Instructor") && !hasManagerAccess) {
                      const restrictedForFaculty = ["New Student (beta)", "Manage Students (beta)"];
                      if (restrictedForFaculty.includes(subItem.name)) {
                        return null;
                      }
                    }

                    return (
                      <li key={subItem.name} className={subItemDisabledClass}>
                        <Link
                          to={isSubItemEnabled ? subItem.path : "#"}
                          onClick={e => !isSubItemEnabled && e.preventDefault()}
                          className={`menu-dropdown-item ${isActive(subItem.path)
                            ? "menu-dropdown-item-active"
                            : "menu-dropdown-item-inactive"
                            }`}
                          id={`sidebar-subitem-${subItem.name.replace(/\s+/g, '-').toLowerCase()}`}
                        >
                          {subItem.name}
                          <span className="flex items-center gap-1 ml-auto">
                            {subItem.new && (
                              <span
                                className={`ml-auto ${isActive(subItem.path)
                                  ? "menu-dropdown-badge-active"
                                  : "menu-dropdown-badge-inactive"
                                  } menu-dropdown-badge`}
                              >
                                new
                              </span>
                            )}
                            {subItem.pro && (
                              <span
                                className={`ml-auto ${isActive(subItem.path)
                                  ? "menu-dropdown-badge-active"
                                  : "menu-dropdown-badge-inactive"
                                  } menu-dropdown-badge`}
                              >
                                pro
                              </span>
                            )}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${isExpanded || isMobileOpen
          ? "w-[290px]"
          : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
    >
      <div
        className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
          }`}
      >
        <Link to="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <img
                className="dark:hidden"
                src="/images/logo/logo.svg"
                alt="Logo"
                width={150}
                height={40}
              />
              <img
                className="hidden dark:block"
                src="/images/logo/logo-dark.svg"
                alt="Logo"
                width={150}
                height={40}
              />
            </>
          ) : (
            <img
              src="/images/logo/logo-icon.svg"
              alt="Logo"
              width={48}
              height={48}
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                  }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (user?.roles?.[0] || "Menu") : <MoreDotIcon className="size-6" />}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>
            <div className="">
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                  }`}
              >
                {isExpanded || isHovered || isMobileOpen ? "Downloads" : <MoreDotIcon />}
              </h2>
              {renderMenuItems(othersItems, "others")}
            </div>
            <div className="">
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                  }`}
              >
                {isExpanded || isHovered || isMobileOpen ? "Settings" : <MoreDotIcon />}
              </h2>
              {renderMenuItems(settingsItems, "settings")}
            </div>
          </div>
        </nav>
        {(isExpanded || isHovered || isMobileOpen) && <SidebarWidget />}
      </div>
    </aside>
  );
};

export default AppSidebar;
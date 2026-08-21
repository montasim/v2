import { forwardRef } from "react"
import type { ForwardRefExoticComponent, RefAttributes } from "react"
import HugeAirplaneTiltIcon from "@hugeicons/core-free-icons/Airplane02Icon"
import HugeWarningCircleIcon from "@hugeicons/core-free-icons/AlertCircleIcon"
import HugeCaretDownIcon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import HugeCaretLeftIcon from "@hugeicons/core-free-icons/ArrowLeft01Icon"
import HugeArrowLeftIcon from "@hugeicons/core-free-icons/ArrowLeft02Icon"
import HugeArrowLeftCompactIcon from "@hugeicons/core-free-icons/ArrowLeft04Icon"
import HugeArrowRightIcon from "@hugeicons/core-free-icons/ArrowRight02Icon"
import HugeArrowRightCompactIcon from "@hugeicons/core-free-icons/ArrowRight04Icon"
import HugeArrowUpIcon from "@hugeicons/core-free-icons/ArrowUp02Icon"
import HugeArrowUpRightIcon from "@hugeicons/core-free-icons/ArrowUpRight02Icon"
import HugeAtomIcon from "@hugeicons/core-free-icons/Atom01Icon"
import HugeBookOpenTextIcon from "@hugeicons/core-free-icons/BookOpenTextIcon"
import HugeBracketsCurlyIcon from "@hugeicons/core-free-icons/BracesIcon"
import HugeBriefcaseIcon from "@hugeicons/core-free-icons/Briefcase02Icon"
import HugeCalendarBlankIcon from "@hugeicons/core-free-icons/Calendar03Icon"
import HugeCalendarCheckIcon from "@hugeicons/core-free-icons/CalendarCheckIcon"
import HugeVideoCameraIcon from "@hugeicons/core-free-icons/CameraVideoIcon"
import HugeXIcon from "@hugeicons/core-free-icons/Cancel01Icon"
import HugeCertificateIcon from "@hugeicons/core-free-icons/Certificate01Icon"
import HugeCheckIcon from "@hugeicons/core-free-icons/CheckIcon"
import HugeCheckCircleIcon from "@hugeicons/core-free-icons/CheckmarkCircle02Icon"
import HugeCircleDashedIcon from "@hugeicons/core-free-icons/CircleDashedIcon"
import HugeClipboardIcon from "@hugeicons/core-free-icons/ClipboardIcon"
import HugeClockIcon from "@hugeicons/core-free-icons/Clock01Icon"
import HugeCloudIcon from "@hugeicons/core-free-icons/CloudIcon"
import HugeCodeIcon from "@hugeicons/core-free-icons/CodeIcon"
import HugeCoffeeIcon from "@hugeicons/core-free-icons/Coffee01Icon"
import HugeCopyIcon from "@hugeicons/core-free-icons/Copy01Icon"
import HugeFileCssIcon from "@hugeicons/core-free-icons/CssFile01Icon"
import HugeCubeIcon from "@hugeicons/core-free-icons/CubeIcon"
import HugeSelectionAllIcon from "@hugeicons/core-free-icons/CursorRectangleSelection01Icon"
import HugeGaugeIcon from "@hugeicons/core-free-icons/DashboardSpeed01Icon"
import HugeSquaresFourIcon from "@hugeicons/core-free-icons/DashboardSquare02Icon"
import HugeDatabaseIcon from "@hugeicons/core-free-icons/Database01Icon"
import HugeDownloadSimpleIcon from "@hugeicons/core-free-icons/Download03Icon"
import HugePlugsConnectedIcon from "@hugeicons/core-free-icons/ElectricPlugsIcon"
import HugeFigmaLogoIcon from "@hugeicons/core-free-icons/FigmaIcon"
import HugeFileXlsIcon from "@hugeicons/core-free-icons/FileSpreadsheetIcon"
import HugeFileDocIcon from "@hugeicons/core-free-icons/FileTextIcon"
import HugeFilesIcon from "@hugeicons/core-free-icons/Files01Icon"
import HugeFlaskIcon from "@hugeicons/core-free-icons/FlaskConicalIcon"
import HugeFolderIcon from "@hugeicons/core-free-icons/Folder01Icon"
import HugeFunnelSimpleIcon from "@hugeicons/core-free-icons/FunnelIcon"
import HugeGitBranchIcon from "@hugeicons/core-free-icons/GitBranchIcon"
import HugeGitCommitIcon from "@hugeicons/core-free-icons/GitCommitIcon"
import HugeGithubLogoIcon from "@hugeicons/core-free-icons/Github01Icon"
import HugeGraduationCapIcon from "@hugeicons/core-free-icons/GraduationCapIcon"
import HugeCirclesThreePlusIcon from "@hugeicons/core-free-icons/GroupItemsIcon"
import HugeHandHeartIcon from "@hugeicons/core-free-icons/HandHeartIcon"
import HugeHandIcon from "@hugeicons/core-free-icons/HandIcon"
import HugeHardDrivesIcon from "@hugeicons/core-free-icons/HardDriveIcon"
import HugeHeartStraightIcon from "@hugeicons/core-free-icons/HeartIcon"
import HugeHexagonIcon from "@hugeicons/core-free-icons/HexagonIcon"
import HugeTreeStructureIcon from "@hugeicons/core-free-icons/HierarchyIcon"
import HugeHouseLineIcon from "@hugeicons/core-free-icons/House01Icon"
import HugeFileHtmlIcon from "@hugeicons/core-free-icons/HtmlFile01Icon"
import HugeFileJsIcon from "@hugeicons/core-free-icons/JavaScriptIcon"
import HugeLeafIcon from "@hugeicons/core-free-icons/Leaf01Icon"
import HugeLightbulbIcon from "@hugeicons/core-free-icons/LightbulbIcon"
import HugeLinkedinLogoIcon from "@hugeicons/core-free-icons/Linkedin01Icon"
import HugeListChecksIcon from "@hugeicons/core-free-icons/ListChecksIcon"
import HugeEnvelopeSimpleIcon from "@hugeicons/core-free-icons/Mail01Icon"
import HugeMapPinIcon from "@hugeicons/core-free-icons/MapPinIcon"
import HugeListIcon from "@hugeicons/core-free-icons/Menu01Icon"
import HugeChatCircleDotsIcon from "@hugeicons/core-free-icons/MessageCircleMoreIcon"
import HugeChatCenteredDotsIcon from "@hugeicons/core-free-icons/MessageSquareMoreIcon"
import HugeDevicesIcon from "@hugeicons/core-free-icons/MonitorSmartphoneIcon"
import HugeMoonIcon from "@hugeicons/core-free-icons/Moon02Icon"
import HugePackageIcon from "@hugeicons/core-free-icons/PackageIcon"
import HugePencilSimpleIcon from "@hugeicons/core-free-icons/PencilEdit01Icon"
import HugePolygonIcon from "@hugeicons/core-free-icons/PolygonIcon"
import HugeFilePptIcon from "@hugeicons/core-free-icons/Presentation01Icon"
import HugeQuotesIcon from "@hugeicons/core-free-icons/QuoteDownIcon"
import HugeArrowClockwiseIcon from "@hugeicons/core-free-icons/RefreshCwIcon"
import HugeArrowsClockwiseIcon from "@hugeicons/core-free-icons/RefreshIcon"
import HugeRulerIcon from "@hugeicons/core-free-icons/RulerIcon"
import HugePaperPlaneTiltIcon from "@hugeicons/core-free-icons/SendIcon"
import HugeGearIcon from "@hugeicons/core-free-icons/Settings02Icon"
import HugeShieldCheckIcon from "@hugeicons/core-free-icons/ShieldCheckIcon"
import HugeSparkleIcon from "@hugeicons/core-free-icons/SparkleIcon"
import HugeStudentIcon from "@hugeicons/core-free-icons/StudentIcon"
import HugeSunIcon from "@hugeicons/core-free-icons/Sun03Icon"
import HugeTestTubeIcon from "@hugeicons/core-free-icons/TestTubeIcon"
import HugeFileTsIcon from "@hugeicons/core-free-icons/Typescript01Icon"
import HugeUsersThreeIcon from "@hugeicons/core-free-icons/UserGroupIcon"
import HugeUserIcon from "@hugeicons/core-free-icons/UserIcon"
import HugeUserFocusIcon from "@hugeicons/core-free-icons/UserSearch01Icon"
import HugeVideoIcon from "@hugeicons/core-free-icons/Video01Icon"
import HugeWhatsappLogoIcon from "@hugeicons/core-free-icons/WhatsappIcon"
import HugeWindIcon from "@hugeicons/core-free-icons/WindIcon"
import HugeWrenchIcon from "@hugeicons/core-free-icons/Wrench01Icon"
import HugeLightningIcon from "@hugeicons/core-free-icons/ZapIcon"
import { HugeiconsIcon } from "@hugeicons/react"
import type { HugeiconsIconProps, IconSvgElement } from "@hugeicons/react"

export type IconProps = Omit<HugeiconsIconProps, "altIcon" | "icon">
export type Icon = ForwardRefExoticComponent<
  IconProps & RefAttributes<SVGSVGElement>
>

function createIcon(icon: IconSvgElement, displayName: string): Icon {
  const Component = forwardRef<SVGSVGElement, IconProps>(function AppIcon(
    { strokeWidth = 1.5, ...props },
    ref
  ) {
    return (
      <HugeiconsIcon
        ref={ref}
        icon={icon}
        strokeWidth={strokeWidth}
        focusable="false"
        aria-hidden={props["aria-label"] ? undefined : true}
        {...props}
      />
    )
  })
  Component.displayName = displayName
  return Component
}

export const AirplaneTiltIcon = createIcon(
  HugeAirplaneTiltIcon,
  "AirplaneTiltIcon"
)
export const ArrowClockwiseIcon = createIcon(
  HugeArrowClockwiseIcon,
  "ArrowClockwiseIcon"
)
export const ArrowLeftIcon = createIcon(HugeArrowLeftIcon, "ArrowLeftIcon")
export const ArrowLeftCompactIcon = createIcon(
  HugeArrowLeftCompactIcon,
  "ArrowLeftCompactIcon"
)
export const ArrowRightIcon = createIcon(HugeArrowRightIcon, "ArrowRightIcon")
export const ArrowRightCompactIcon = createIcon(
  HugeArrowRightCompactIcon,
  "ArrowRightCompactIcon"
)
export const ArrowsClockwiseIcon = createIcon(
  HugeArrowsClockwiseIcon,
  "ArrowsClockwiseIcon"
)
export const ArrowUpIcon = createIcon(HugeArrowUpIcon, "ArrowUpIcon")
export const ArrowUpRightIcon = createIcon(
  HugeArrowUpRightIcon,
  "ArrowUpRightIcon"
)
export const AtomIcon = createIcon(HugeAtomIcon, "AtomIcon")
export const BookOpenTextIcon = createIcon(
  HugeBookOpenTextIcon,
  "BookOpenTextIcon"
)
export const BracketsCurlyIcon = createIcon(
  HugeBracketsCurlyIcon,
  "BracketsCurlyIcon"
)
export const BriefcaseIcon = createIcon(HugeBriefcaseIcon, "BriefcaseIcon")
export const CalendarBlankIcon = createIcon(
  HugeCalendarBlankIcon,
  "CalendarBlankIcon"
)
export const CalendarCheckIcon = createIcon(
  HugeCalendarCheckIcon,
  "CalendarCheckIcon"
)
export const CaretDownIcon = createIcon(HugeCaretDownIcon, "CaretDownIcon")
export const CaretLeftIcon = createIcon(HugeCaretLeftIcon, "CaretLeftIcon")
export const CertificateIcon = createIcon(
  HugeCertificateIcon,
  "CertificateIcon"
)
export const ChatCenteredDotsIcon = createIcon(
  HugeChatCenteredDotsIcon,
  "ChatCenteredDotsIcon"
)
export const ChatCircleDotsIcon = createIcon(
  HugeChatCircleDotsIcon,
  "ChatCircleDotsIcon"
)
export const CheckCircleIcon = createIcon(
  HugeCheckCircleIcon,
  "CheckCircleIcon"
)
export const CheckIcon = createIcon(HugeCheckIcon, "CheckIcon")
export const CircleDashedIcon = createIcon(
  HugeCircleDashedIcon,
  "CircleDashedIcon"
)
export const CirclesThreePlusIcon = createIcon(
  HugeCirclesThreePlusIcon,
  "CirclesThreePlusIcon"
)
export const ClipboardIcon = createIcon(HugeClipboardIcon, "ClipboardIcon")
export const ClockIcon = createIcon(HugeClockIcon, "ClockIcon")
export const CloudIcon = createIcon(HugeCloudIcon, "CloudIcon")
export const CodeIcon = createIcon(HugeCodeIcon, "CodeIcon")
export const CoffeeIcon = createIcon(HugeCoffeeIcon, "CoffeeIcon")
export const CopyIcon = createIcon(HugeCopyIcon, "CopyIcon")
export const CubeIcon = createIcon(HugeCubeIcon, "CubeIcon")
export const DatabaseIcon = createIcon(HugeDatabaseIcon, "DatabaseIcon")
export const DevicesIcon = createIcon(HugeDevicesIcon, "DevicesIcon")
export const DownloadSimpleIcon = createIcon(
  HugeDownloadSimpleIcon,
  "DownloadSimpleIcon"
)
export const EnvelopeSimpleIcon = createIcon(
  HugeEnvelopeSimpleIcon,
  "EnvelopeSimpleIcon"
)
export const FigmaLogoIcon = createIcon(HugeFigmaLogoIcon, "FigmaLogoIcon")
export const FileCssIcon = createIcon(HugeFileCssIcon, "FileCssIcon")
export const FileDocIcon = createIcon(HugeFileDocIcon, "FileDocIcon")
export const FileHtmlIcon = createIcon(HugeFileHtmlIcon, "FileHtmlIcon")
export const FileJsIcon = createIcon(HugeFileJsIcon, "FileJsIcon")
export const FilePptIcon = createIcon(HugeFilePptIcon, "FilePptIcon")
export const FilesIcon = createIcon(HugeFilesIcon, "FilesIcon")
export const FileTsIcon = createIcon(HugeFileTsIcon, "FileTsIcon")
export const FileXlsIcon = createIcon(HugeFileXlsIcon, "FileXlsIcon")
export const FlaskIcon = createIcon(HugeFlaskIcon, "FlaskIcon")
export const FolderIcon = createIcon(HugeFolderIcon, "FolderIcon")
export const FunnelSimpleIcon = createIcon(
  HugeFunnelSimpleIcon,
  "FunnelSimpleIcon"
)
export const GaugeIcon = createIcon(HugeGaugeIcon, "GaugeIcon")
export const GearIcon = createIcon(HugeGearIcon, "GearIcon")
export const GitBranchIcon = createIcon(HugeGitBranchIcon, "GitBranchIcon")
export const GitCommitIcon = createIcon(HugeGitCommitIcon, "GitCommitIcon")
export const GithubLogoIcon = createIcon(HugeGithubLogoIcon, "GithubLogoIcon")
export const GraduationCapIcon = createIcon(
  HugeGraduationCapIcon,
  "GraduationCapIcon"
)
export const HandHeartIcon = createIcon(HugeHandHeartIcon, "HandHeartIcon")
export const HandIcon = createIcon(HugeHandIcon, "HandIcon")
export const HardDrivesIcon = createIcon(HugeHardDrivesIcon, "HardDrivesIcon")
export const HeartStraightIcon = createIcon(
  HugeHeartStraightIcon,
  "HeartStraightIcon"
)
export const HexagonIcon = createIcon(HugeHexagonIcon, "HexagonIcon")
export const HouseLineIcon = createIcon(HugeHouseLineIcon, "HouseLineIcon")
export const LeafIcon = createIcon(HugeLeafIcon, "LeafIcon")
export const LightbulbIcon = createIcon(HugeLightbulbIcon, "LightbulbIcon")
export const LightningIcon = createIcon(HugeLightningIcon, "LightningIcon")
export const LinkedinLogoIcon = createIcon(
  HugeLinkedinLogoIcon,
  "LinkedinLogoIcon"
)
export const ListChecksIcon = createIcon(HugeListChecksIcon, "ListChecksIcon")
export const ListIcon = createIcon(HugeListIcon, "ListIcon")
export const MapPinIcon = createIcon(HugeMapPinIcon, "MapPinIcon")
export const MoonIcon = createIcon(HugeMoonIcon, "MoonIcon")
export const PackageIcon = createIcon(HugePackageIcon, "PackageIcon")
export const PaperPlaneTiltIcon = createIcon(
  HugePaperPlaneTiltIcon,
  "PaperPlaneTiltIcon"
)
export const PencilSimpleIcon = createIcon(
  HugePencilSimpleIcon,
  "PencilSimpleIcon"
)
export const PlugsConnectedIcon = createIcon(
  HugePlugsConnectedIcon,
  "PlugsConnectedIcon"
)
export const PolygonIcon = createIcon(HugePolygonIcon, "PolygonIcon")
export const QuotesIcon = createIcon(HugeQuotesIcon, "QuotesIcon")
export const ReadCvLogoIcon = createIcon(HugeFileDocIcon, "ReadCvLogoIcon")
export const RulerIcon = createIcon(HugeRulerIcon, "RulerIcon")
export const SelectionAllIcon = createIcon(
  HugeSelectionAllIcon,
  "SelectionAllIcon"
)
export const ShieldCheckIcon = createIcon(
  HugeShieldCheckIcon,
  "ShieldCheckIcon"
)
export const SparkleIcon = createIcon(HugeSparkleIcon, "SparkleIcon")
export const SquaresFourIcon = createIcon(
  HugeSquaresFourIcon,
  "SquaresFourIcon"
)
export const StudentIcon = createIcon(HugeStudentIcon, "StudentIcon")
export const SunIcon = createIcon(HugeSunIcon, "SunIcon")
export const TestTubeIcon = createIcon(HugeTestTubeIcon, "TestTubeIcon")
export const TreeStructureIcon = createIcon(
  HugeTreeStructureIcon,
  "TreeStructureIcon"
)
export const UserFocusIcon = createIcon(HugeUserFocusIcon, "UserFocusIcon")
export const UserIcon = createIcon(HugeUserIcon, "UserIcon")
export const UsersThreeIcon = createIcon(HugeUsersThreeIcon, "UsersThreeIcon")
export const VideoCameraIcon = createIcon(
  HugeVideoCameraIcon,
  "VideoCameraIcon"
)
export const VideoIcon = createIcon(HugeVideoIcon, "VideoIcon")
export const WarningCircleIcon = createIcon(
  HugeWarningCircleIcon,
  "WarningCircleIcon"
)
export const WhatsappLogoIcon = createIcon(
  HugeWhatsappLogoIcon,
  "WhatsappLogoIcon"
)
export const WindIcon = createIcon(HugeWindIcon, "WindIcon")
export const WrenchIcon = createIcon(HugeWrenchIcon, "WrenchIcon")
export const XIcon = createIcon(HugeXIcon, "XIcon")

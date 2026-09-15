import { TabsContent } from "@/shared/ui/tabs";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  User,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import CountryLocationFields from "../CountryLocationFields";
import {
  WizardTabIntro,
  EDITOR_INPUT_CLASS,
  EDITOR_LABEL_CLASS,
} from "./shared";

export interface HeaderTabProps {
  getSectionContent: (type: string) => any;
  updateSection: (type: string, fields: any) => void;
  isValidEmail: (email: string) => boolean;
  isValidUrl: (url: string) => boolean;
}

export default function HeaderTab({
  getSectionContent,
  updateSection,
  isValidEmail,
  isValidUrl,
}: HeaderTabProps) {
  return (
    <TabsContent value="header" className="space-y-5">
      <WizardTabIntro
        icon={User}
        title="Contact Information"
        description="Your name, title, and contact details that appear at the top of your resume."
      />
      <div className="grid resume-editor-grid-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="edit-name" className={EDITOR_LABEL_CLASS}>
            Full Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="edit-name"
            placeholder="e.g. John Doe"
            className={EDITOR_INPUT_CLASS}
            value={getSectionContent("header").header?.name || ""}
            onChange={e =>
              updateSection("header", {
                header: {
                  ...getSectionContent("header").header,
                  name: e.target.value,
                },
              })
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-jobtitle" className={EDITOR_LABEL_CLASS}>
            Job Title
          </Label>
          <Input
            id="edit-jobtitle"
            placeholder="e.g. Full-Stack Developer"
            className={EDITOR_INPUT_CLASS}
            value={
              getSectionContent("header").header?.jobTitle || ""
            }
            onChange={e =>
              updateSection("header", {
                header: {
                  ...getSectionContent("header").header,
                  jobTitle: e.target.value,
                },
              })
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-targetrole" className={EDITOR_LABEL_CLASS}>
            Target Role
          </Label>
          <Input
            id="edit-targetrole"
            placeholder="e.g. Senior Software Engineer"
            className={EDITOR_INPUT_CLASS}
            value={
              getSectionContent("header").header?.targetRole || ""
            }
            onChange={e =>
              updateSection("header", {
                header: {
                  ...getSectionContent("header").header,
                  targetRole: e.target.value,
                },
              })
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-email" className={EDITOR_LABEL_CLASS}>
            Email Address <span className="text-destructive">*</span>
          </Label>
          <Input
            id="edit-email"
            type="email"
            placeholder="you@email.com"
            className={cn(
              EDITOR_INPUT_CLASS,
              !isValidEmail(
                getSectionContent("header").header?.email
              ) && "border-destructive focus-visible:ring-destructive"
            )}
            value={getSectionContent("header").header?.email || ""}
            onChange={e =>
              updateSection("header", {
                header: {
                  ...getSectionContent("header").header,
                  email: e.target.value,
                },
              })
            }
          />
          {!isValidEmail(
            getSectionContent("header").header?.email
          ) && (
            <span className="text-[10px] text-destructive font-medium block">
              Please enter a valid email address.
            </span>
          )}
        </div>
        <div className="col-span-2">
          <CountryLocationFields
            compact
            countryCode={
              getSectionContent("header").header?.countryCode || ""
            }
            locationFields={
              getSectionContent("header").header?.locationFields ||
              {}
            }
            phone={getSectionContent("header").header?.phone || ""}
            targetCountryCode={
              getSectionContent("header").header
                ?.targetCountryCode || ""
            }
            location={
              getSectionContent("header").header?.location || ""
            }
            onCountryChange={code =>
              updateSection("header", {
                header: {
                  ...getSectionContent("header").header,
                  countryCode: code,
                },
              })
            }
            onTargetCountryChange={code =>
              updateSection("header", {
                header: {
                  ...getSectionContent("header").header,
                  targetCountryCode: code,
                },
              })
            }
            onLocationFieldChange={fields =>
              updateSection("header", {
                header: {
                  ...getSectionContent("header").header,
                  locationFields: fields,
                },
              })
            }
            onPhoneChange={phone =>
              updateSection("header", {
                header: {
                  ...getSectionContent("header").header,
                  phone,
                },
              })
            }
            onLocationStringChange={location =>
              updateSection("header", {
                header: {
                  ...getSectionContent("header").header,
                  location,
                },
              })
            }
          />
        </div>
      </div>

      <div className="border-t border-border pt-5 space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          <h4 className="text-sm font-bold text-foreground">
            Social & Website Profiles
          </h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label htmlFor="edit-linkedin" className={EDITOR_LABEL_CLASS}>
              LinkedIn URL
            </Label>
            <Input
              id="edit-linkedin"
              placeholder="linkedin.com/in/username"
              className={cn(
                EDITOR_INPUT_CLASS,
                !isValidUrl(
                  getSectionContent("header").header?.links?.find(
                    (l: any) => l.label.toLowerCase() === "linkedin"
                  )?.url
                ) && "border-destructive focus-visible:ring-destructive"
              )}
              value={
                getSectionContent("header").header?.links?.find(
                  (l: any) => l.label.toLowerCase() === "linkedin"
                )?.url || ""
              }
              onChange={e => {
                const headerObj =
                  getSectionContent("header").header || {};
                const linksObj = headerObj.links || [];
                let updatedLinks = [...linksObj];
                const linkIdx = updatedLinks.findIndex(
                  (l: any) => l.label.toLowerCase() === "linkedin"
                );
                if (linkIdx > -1) {
                  if (e.target.value) {
                    updatedLinks[linkIdx] = {
                      ...updatedLinks[linkIdx],
                      url: e.target.value,
                    };
                  } else {
                    updatedLinks.splice(linkIdx, 1);
                  }
                } else if (e.target.value) {
                  updatedLinks.push({
                    label: "LinkedIn",
                    url: e.target.value,
                  });
                }
                updateSection("header", {
                  header: { ...headerObj, links: updatedLinks },
                });
              }}
            />
            {!isValidUrl(
              getSectionContent("header").header?.links?.find(
                (l: any) => l.label.toLowerCase() === "linkedin"
              )?.url
            ) && (
              <span className="text-[10px] text-destructive font-medium block">
                Please enter a valid URL.
              </span>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-github" className={EDITOR_LABEL_CLASS}>
              GitHub URL
            </Label>
            <Input
              id="edit-github"
              placeholder="github.com/username"
              className={cn(
                EDITOR_INPUT_CLASS,
                !isValidUrl(
                  getSectionContent("header").header?.links?.find(
                    (l: any) => l.label.toLowerCase() === "github"
                  )?.url
                ) && "border-destructive focus-visible:ring-destructive"
              )}
              value={
                getSectionContent("header").header?.links?.find(
                  (l: any) => l.label.toLowerCase() === "github"
                )?.url || ""
              }
              onChange={e => {
                const headerObj =
                  getSectionContent("header").header || {};
                const linksObj = headerObj.links || [];
                let updatedLinks = [...linksObj];
                const linkIdx = updatedLinks.findIndex(
                  (l: any) => l.label.toLowerCase() === "github"
                );
                if (linkIdx > -1) {
                  if (e.target.value) {
                    updatedLinks[linkIdx] = {
                      ...updatedLinks[linkIdx],
                      url: e.target.value,
                    };
                  } else {
                    updatedLinks.splice(linkIdx, 1);
                  }
                } else if (e.target.value) {
                  updatedLinks.push({
                    label: "GitHub",
                    url: e.target.value,
                  });
                }
                updateSection("header", {
                  header: { ...headerObj, links: updatedLinks },
                });
              }}
            />
            {!isValidUrl(
              getSectionContent("header").header?.links?.find(
                (l: any) => l.label.toLowerCase() === "github"
              )?.url
            ) && (
              <span className="text-[10px] text-destructive font-medium block">
                Please enter a valid URL.
              </span>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-portfolio" className={EDITOR_LABEL_CLASS}>
              Portfolio Website URL
            </Label>
            <Input
              id="edit-portfolio"
              placeholder="yourportfolio.com"
              className={cn(
                EDITOR_INPUT_CLASS,
                !isValidUrl(
                  getSectionContent("header").header?.links?.find(
                    (l: any) =>
                      l.label.toLowerCase() === "portfolio" ||
                      l.label.toLowerCase() === "website"
                  )?.url
                ) && "border-destructive focus-visible:ring-destructive"
              )}
              value={
                getSectionContent("header").header?.links?.find(
                  (l: any) =>
                    l.label.toLowerCase() === "portfolio" ||
                    l.label.toLowerCase() === "website"
                )?.url || ""
              }
              onChange={e => {
                const headerObj =
                  getSectionContent("header").header || {};
                const linksObj = headerObj.links || [];
                let updatedLinks = [...linksObj];
                const linkIdx = updatedLinks.findIndex(
                  (l: any) =>
                    l.label.toLowerCase() === "portfolio" ||
                    l.label.toLowerCase() === "website"
                );
                if (linkIdx > -1) {
                  if (e.target.value) {
                    updatedLinks[linkIdx] = {
                      ...updatedLinks[linkIdx],
                      url: e.target.value,
                    };
                  } else {
                    updatedLinks.splice(linkIdx, 1);
                  }
                } else if (e.target.value) {
                  updatedLinks.push({
                    label: "Portfolio",
                    url: e.target.value,
                  });
                }
                updateSection("header", {
                  header: { ...headerObj, links: updatedLinks },
                });
              }}
            />
            {!isValidUrl(
              getSectionContent("header").header?.links?.find(
                (l: any) =>
                  l.label.toLowerCase() === "portfolio" ||
                  l.label.toLowerCase() === "website"
              )?.url
            ) && (
              <span className="text-[10px] text-destructive font-medium block">
                Please enter a valid URL.
              </span>
            )}
          </div>
        </div>
      </div>
    </TabsContent>
  );
}

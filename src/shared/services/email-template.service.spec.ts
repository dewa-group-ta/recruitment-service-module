import { Test, TestingModule } from "@nestjs/testing";
import { EmailTemplateService } from "./email-template.service";
import { EmailTemplateName } from "../enums/email.enum";

describe("EmailTemplateService", () => {
  let service: EmailTemplateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailTemplateService]
    }).compile();

    service = module.get<EmailTemplateService>(EmailTemplateService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getTemplate", () => {
    it("should return application received template", () => {
      const template = service.getTemplate(
        EmailTemplateName.APPLICATION_RECEIVED
      );

      expect(template).toBeDefined();
      expect(template.subject).toContain("Application Received");
      expect(template.text).toContain("{{applicantName}}");
      expect(template.text).toContain("{{jobTitle}}");
      expect(template.text).toContain("{{applicationLink}}");
      expect(template.html).toContain("{{applicantName}}");
      expect(template.html).toContain("{{jobTitle}}");
      expect(template.html).toContain("{{applicationLink}}");
    });

    it("should return application status update template", () => {
      const template = service.getTemplate(
        EmailTemplateName.APPLICATION_STATUS_UPDATE
      );

      expect(template).toBeDefined();
      expect(template.subject).toContain("Application Status Update");
      expect(template.text).toContain("{{applicantName}}");
      expect(template.text).toContain("{{jobTitle}}");
      expect(template.text).toContain("{{status}}");
      expect(template.html).toContain("{{applicantName}}");
      expect(template.html).toContain("{{jobTitle}}");
      expect(template.html).toContain("{{status}}");
    });

    it("should return interview invitation template", () => {
      const template = service.getTemplate(
        EmailTemplateName.INTERVIEW_INVITATION
      );

      expect(template).toBeDefined();
      expect(template.subject).toContain("Interview Invitation");
      expect(template.text).toContain("{{applicantName}}");
      expect(template.text).toContain("{{jobTitle}}");
      expect(template.text).toContain("{{interviewDate}}");
      expect(template.text).toContain("{{interviewLocation}}");
      expect(template.html).toContain("{{applicantName}}");
      expect(template.html).toContain("{{jobTitle}}");
      expect(template.html).toContain("{{interviewDate}}");
      expect(template.html).toContain("{{interviewLocation}}");
    });

    it("should return null for non-existent template", () => {
      const template = service.getTemplate("NON_EXISTENT_TEMPLATE" as any);

      expect(template).toBeNull();
    });
  });

  describe("renderTemplate", () => {
    it("should render template with single variable", () => {
      const template = "Hello {{name}}!";
      const data = { name: "John" };

      const result = service.renderTemplate(template, data);

      expect(result).toBe("Hello John!");
    });

    it("should render template with multiple variables", () => {
      const template =
        "Dear {{applicantName}}, your application for {{jobTitle}} has been {{status}}.";
      const data = {
        applicantName: "John Doe",
        jobTitle: "Software Engineer",
        status: "approved"
      };

      const result = service.renderTemplate(template, data);

      expect(result).toBe(
        "Dear John Doe, your application for Software Engineer has been approved."
      );
    });

    it("should handle missing variables by leaving placeholders unchanged", () => {
      const template = "Hello {{name}}, your {{missingVar}} is ready.";
      const data = { name: "John" };

      const result = service.renderTemplate(template, data);

      expect(result).toBe("Hello John, your {{missingVar}} is ready.");
    });

    it("should handle empty data object", () => {
      const template = "Hello {{name}}!";
      const data = {};

      const result = service.renderTemplate(template, data);

      expect(result).toBe("Hello {{name}}!");
    });

    it("should handle template with no variables", () => {
      const template = "This is a static message.";
      const data = { name: "John" };

      const result = service.renderTemplate(template, data);

      expect(result).toBe("This is a static message.");
    });

    it("should handle null or undefined values in data", () => {
      const template = "Hello {{name}}, your status is {{status}}.";
      const data = { name: "John", status: null };

      const result = service.renderTemplate(template, data);

      expect(result).toBe("Hello John, your status is null.");
    });

    it("should handle complex HTML templates", () => {
      const template = `
        <div>
          <h1>Welcome {{applicantName}}</h1>
          <p>Your application for <strong>{{jobTitle}}</strong> has been received.</p>
          <a href="{{applicationLink}}">View Application</a>
        </div>
      `;
      const data = {
        applicantName: "John Doe",
        jobTitle: "Software Engineer",
        applicationLink: "https://example.com/application/123"
      };

      const result = service.renderTemplate(template, data);

      expect(result).toContain("Welcome John Doe");
      expect(result).toContain("Software Engineer");
      expect(result).toContain("https://example.com/application/123");
    });

    it("should handle special characters in data", () => {
      const template = "Message: {{message}}";
      const data = {
        message: 'Hello & welcome! <script>alert("test")</script>'
      };

      const result = service.renderTemplate(template, data);

      expect(result).toBe(
        'Message: Hello & welcome! <script>alert("test")</script>'
      );
    });
  });

  describe("getAllTemplates", () => {
    it("should return all available templates", () => {
      const templates = service.getAllTemplates();

      expect(templates).toBeDefined();
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);

      templates.forEach((template) => {
        expect(template).toHaveProperty("name");
        expect(template).toHaveProperty("subject");
        expect(template).toHaveProperty("text");
        expect(template).toHaveProperty("html");
      });
    });

    it("should include all predefined template names", () => {
      const templates = service.getAllTemplates();
      const templateNames = templates.map((t) => t.name);

      expect(templateNames).toContain(EmailTemplateName.APPLICATION_RECEIVED);
      expect(templateNames).toContain(
        EmailTemplateName.APPLICATION_STATUS_UPDATE
      );
      expect(templateNames).toContain(EmailTemplateName.INTERVIEW_INVITATION);
    });
  });

  describe("template validation", () => {
    it("should have valid application received template structure", () => {
      const template = service.getTemplate(
        EmailTemplateName.APPLICATION_RECEIVED
      );

      expect(template).toBeDefined();
      expect(template.subject).toBeTruthy();
      expect(template.text).toBeTruthy();
      expect(template.html).toBeTruthy();
      expect(typeof template.subject).toBe("string");
      expect(typeof template.text).toBe("string");
      expect(typeof template.html).toBe("string");
    });

    it("should have valid application status update template structure", () => {
      const template = service.getTemplate(
        EmailTemplateName.APPLICATION_STATUS_UPDATE
      );

      expect(template).toBeDefined();
      expect(template.subject).toBeTruthy();
      expect(template.text).toBeTruthy();
      expect(template.html).toBeTruthy();
      expect(typeof template.subject).toBe("string");
      expect(typeof template.text).toBe("string");
      expect(typeof template.html).toBe("string");
    });

    it("should have valid interview invitation template structure", () => {
      const template = service.getTemplate(
        EmailTemplateName.INTERVIEW_INVITATION
      );

      expect(template).toBeDefined();
      expect(template.subject).toBeTruthy();
      expect(template.text).toBeTruthy();
      expect(template.html).toBeTruthy();
      expect(typeof template.subject).toBe("string");
      expect(typeof template.text).toBe("string");
      expect(typeof template.html).toBe("string");
    });
  });
});

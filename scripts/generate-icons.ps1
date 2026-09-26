Add-Type -TypeDefinition @"
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Drawing.Text;

public class PwaIconGenerator
{
    public static void Generate(int size, string outputPath, bool isMaskable)
    {
        using (Bitmap bmp = new Bitmap(size, size, PixelFormat.Format32bppArgb))
        using (Graphics g = Graphics.FromImage(bmp))
        {
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            g.PixelOffsetMode = PixelOffsetMode.HighQuality;
            g.TextRenderingHint = TextRenderingHint.AntiAliasGridFit;

            // 1. Solid Outer Background (Dark Carbon Slate)
            Rectangle fullRect = new Rectangle(0, 0, size, size);
            using (LinearGradientBrush bgBrush = new LinearGradientBrush(
                fullRect,
                Color.FromArgb(255, 18, 20, 26),
                Color.FromArgb(255, 9, 10, 14),
                LinearGradientMode.ForwardDiagonal))
            {
                g.FillRectangle(bgBrush, fullRect);
            }

            // 2. Safe zone padding
            int padding = isMaskable ? (int)(size * 0.12f) : (int)(size * 0.05f);
            int innerSize = size - (padding * 2);
            Rectangle innerRect = new Rectangle(padding, padding, innerSize, innerSize);

            // 3. Orange Gradient Accent Border Badge
            int badgeRadius = (int)(innerSize * 0.22f);
            using (GraphicsPath badgePath = CreateRoundedRectanglePath(innerRect, badgeRadius))
            using (LinearGradientBrush accentBrush = new LinearGradientBrush(
                innerRect,
                Color.FromArgb(255, 249, 115, 22),
                Color.FromArgb(255, 217, 70, 0),
                LinearGradientMode.Vertical))
            {
                g.FillPath(accentBrush, badgePath);
            }

            // 4. Inner Dark Metallic Plate
            int plateMargin = Math.Max(2, (int)(innerSize * 0.045f));
            int plateSize = innerSize - (plateMargin * 2);
            Rectangle plateRect = new Rectangle(padding + plateMargin, padding + plateMargin, plateSize, plateSize);
            int plateRadius = (int)(plateSize * 0.20f);
            using (GraphicsPath platePath = CreateRoundedRectanglePath(plateRect, plateRadius))
            using (LinearGradientBrush plateBrush = new LinearGradientBrush(
                plateRect,
                Color.FromArgb(255, 28, 30, 36),
                Color.FromArgb(255, 13, 14, 17),
                LinearGradientMode.Vertical))
            {
                g.FillPath(plateBrush, platePath);

                // Subtle plate inner highlight line
                using (Pen plateBorderPen = new Pen(Color.FromArgb(80, 255, 255, 255), 1.5f))
                {
                    g.DrawPath(plateBorderPen, platePath);
                }
            }

            // 5. Typography "GTA"
            float gtaFontSize = plateSize * 0.35f;
            using (Font fontGta = new Font("Arial Black", gtaFontSize, FontStyle.Bold, GraphicsUnit.Pixel))
            using (StringFormat sf = new StringFormat { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center })
            using (LinearGradientBrush gtaBrush = new LinearGradientBrush(
                plateRect,
                Color.FromArgb(255, 255, 255, 255),
                Color.FromArgb(255, 210, 215, 225),
                LinearGradientMode.Vertical))
            {
                RectangleF gtaRect = new RectangleF(plateRect.X, plateRect.Y + (plateSize * 0.08f), plateSize, plateSize * 0.44f);
                g.DrawString("GTA", fontGta, gtaBrush, gtaRect, sf);
            }

            // 6. Typography "GARAGE"
            float garageFontSize = plateSize * 0.135f;
            using (Font fontGarage = new Font("Arial Black", garageFontSize, FontStyle.Bold, GraphicsUnit.Pixel))
            using (StringFormat sf = new StringFormat { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center })
            using (LinearGradientBrush garageBrush = new LinearGradientBrush(
                plateRect,
                Color.FromArgb(255, 249, 115, 22),
                Color.FromArgb(255, 234, 88, 12),
                LinearGradientMode.Vertical))
            {
                RectangleF garageRect = new RectangleF(plateRect.X, plateRect.Y + (plateSize * 0.52f), plateSize, plateSize * 0.20f);
                g.DrawString("GARAGE", fontGarage, garageBrush, garageRect, sf);
            }

            // 7. Subtitle "POS BENGKEL"
            float subFontSize = plateSize * 0.075f;
            using (Font fontSub = new Font("Arial", subFontSize, FontStyle.Bold, GraphicsUnit.Pixel))
            using (StringFormat sf = new StringFormat { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center })
            using (SolidBrush subBrush = new SolidBrush(Color.FromArgb(200, 160, 165, 175)))
            {
                RectangleF subRect = new RectangleF(plateRect.X, plateRect.Y + (plateSize * 0.74f), plateSize, plateSize * 0.16f);
                g.DrawString("POS BENGKEL", fontSub, subBrush, subRect, sf);
            }

            bmp.Save(outputPath, ImageFormat.Png);
            Console.WriteLine("Successfully created: " + outputPath + " (" + size + "x" + size + ")");
        }
    }

    private static GraphicsPath CreateRoundedRectanglePath(Rectangle rect, int radius)
    {
        GraphicsPath path = new GraphicsPath();
        int diameter = radius * 2;
        Rectangle arcRect = new Rectangle(rect.Location, new Size(diameter, diameter));

        // top-left
        path.AddArc(arcRect, 180, 90);

        // top-right
        arcRect.X = rect.Right - diameter;
        path.AddArc(arcRect, 270, 90);

        // bottom-right
        arcRect.Y = rect.Bottom - diameter;
        path.AddArc(arcRect, 0, 90);

        // bottom-left
        arcRect.X = rect.Left;
        path.AddArc(arcRect, 90, 90);

        path.CloseFigure();
        return path;
    }
}
"@ -ReferencedAssemblies System.Drawing

[PwaIconGenerator]::Generate(192, "public\icons\icon-192.png", $false)
[PwaIconGenerator]::Generate(512, "public\icons\icon-512.png", $false)
[PwaIconGenerator]::Generate(192, "public\icons\icon-maskable-192.png", $true)
[PwaIconGenerator]::Generate(512, "public\icons\icon-maskable-512.png", $true)
[PwaIconGenerator]::Generate(180, "public\apple-icon.png", $false)
[PwaIconGenerator]::Generate(180, "public\apple-touch-icon.png", $false)

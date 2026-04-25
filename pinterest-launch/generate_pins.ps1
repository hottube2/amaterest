Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$PinsDir = Join-Path $Root "pins"
$AssetsDir = Join-Path $Root "assets"
$CaptionsDir = Join-Path $Root "captions"
$UploadDir = Join-Path $Root "upload"

foreach ($dir in @($PinsDir, $AssetsDir, $CaptionsDir, $UploadDir)) {
  New-Item -ItemType Directory -Force -Path $dir | Out-Null
}

$Status = "draft_affiliate_link_added_missing_amazon_visual_pinterest_access"
$AffiliateTag = "amaterest-20"
$LinkDrawer1 = "https://www.amazon.ca/dp/B08KXKVT4K?tag=$AffiliateTag"
$LinkDrawer2 = "https://www.amazon.ca/dp/B07JGWT25L?tag=$AffiliateTag"
$LinkUnderSink1 = "https://www.amazon.ca/dp/B0BZCMRNB9?tag=$AffiliateTag"
$LinkUnderSink2 = "https://www.amazon.ca/dp/B0C1X4PGK4?tag=$AffiliateTag"
$LinkContainers1 = "https://amzn.to/41BjXCA"
$LinkContainers2 = "https://www.amazon.ca/Containers-Vtopmart-Organization-Canisters-Labels%EF%BC%8CBlack/dp/B08ZK5WDWN?utm_source=chatgpt.com&th=1&linkCode=ll2&tag=$AffiliateTag&linkId=a29500070a72f102a49393298e0a0a94&ref_=as_li_ss_tl"
$LinkCloset1 = "https://www.amazon.ca/dp/B07SJ2CTV5?tag=$AffiliateTag"
$LinkShoes1 = "https://www.amazon.ca/dp/B0CNGTZ3B5?tag=$AffiliateTag"
$LinkBestSellers = "https://www.amazon.ca/Best-Sellers/zgbs?tag=$AffiliateTag"

$Pins = @(
  [ordered]@{
    Id = 1
    FileName = "01-tiroir-avant-apres-organisateur.png"
    VisualType = "drawer_before_after"
    ImageText = "Before → After"
    PinTitle = "Ce tiroir était un cauchemar… regarde ça 😳"
    Description = @"
Beaucoup de tiroirs finissent comme ça avec le temps…
Avec un simple organisateur :
✔ tout devient accessible
✔ fini le désordre
✔ installation rapide
Voir ici 👇
$LinkDrawer1
"@
    ProductType = "Organisateur de tiroir"
    AffiliateLink = $LinkDrawer1
    BoardName = "Organisation maison"
    AltText = "Pin Pinterest montrant un tiroir désorganisé puis rangé avec un organisateur de tiroir."
    Accent = "#6F8F7C"
    Dark = "#22302A"
    Background = "#F7F3EA"
  }
  [ordered]@{
    Id = 2
    FileName = "02-sous-evier-rangement-fix.png"
    VisualType = "under_sink"
    ImageText = "Fix en 5 minutes"
    PinTitle = "Le coin le plus chaotique de la maison 😬"
    Description = @"
Sous l’évier est souvent l’endroit le plus désorganisé…
✔ accès facile
✔ plus d’espace
✔ rangement clair
Lien ici 👇
$LinkUnderSink1
"@
    ProductType = "Organisateur sous évier"
    AffiliateLink = $LinkUnderSink1
    BoardName = "Rangement cuisine"
    AltText = "Pin Pinterest montrant une zone sous évier organisée avec un rangement à deux niveaux."
    Accent = "#9A7B6F"
    Dark = "#2C2A28"
    Background = "#F8F5F0"
  }
  [ordered]@{
    Id = 3
    FileName = "03-cuisine-contenants-transparents-aesthetic.png"
    VisualType = "pantry"
    ImageText = "Aesthetic kitchen"
    PinTitle = "Une cuisine simple et propre, ça change tout 😍"
    Description = @"
Les contenants transparents font toute la différence :
✔ look épuré
✔ tout visible
✔ organisation simple
Voir les produits 👇
$LinkContainers1
"@
    ProductType = "Contenants transparents / pantry organization"
    AffiliateLink = $LinkContainers1
    BoardName = "Organisation cuisine"
    AltText = "Pin Pinterest montrant des contenants transparents alignés dans une cuisine organisée."
    Accent = "#627C8C"
    Dark = "#1F2A32"
    Background = "#F7F8F5"
  }
  [ordered]@{
    Id = 4
    FileName = "04-produits-organisation-maison-must-have.png"
    VisualType = "must_have"
    ImageText = "Must-have"
    PinTitle = "5 produits simples qui améliorent une maison"
    Description = @"
Ces produits rendent tout plus facile :
1. Organisateur tiroir
2. Rangement sous évier
3. Bocaux cuisine
4. Placard
5. Chaussures
Voir la liste 👇
$LinkBestSellers
"@
    ProductType = "Liste organisation maison"
    AffiliateLink = $LinkBestSellers
    BoardName = "Organisation maison"
    AltText = "Pin Pinterest listant cinq produits simples pour mieux organiser une maison."
    Accent = "#8F7C55"
    Dark = "#292722"
    Background = "#FAF7EF"
  }
  [ordered]@{
    Id = 5
    FileName = "05-petit-placard-rangement-tissu.png"
    VisualType = "closet"
    ImageText = "Closet hack"
    PinTitle = "Petit espace = vite désorganisé 😤"
    Description = @"
Les petits placards deviennent rapidement encombrés…
✔ plus d’espace
✔ meilleure visibilité
✔ organisation rapide
Lien 👇
$LinkCloset1
"@
    ProductType = "Organisateur de placard / rangement tissu"
    AffiliateLink = $LinkCloset1
    BoardName = "Organisation placard"
    AltText = "Pin Pinterest montrant un petit placard organisé avec des rangements en tissu."
    Accent = "#7E8A6A"
    Dark = "#273026"
    Background = "#F8F6F0"
  }
  [ordered]@{
    Id = 6
    FileName = "06-entree-chaussures-rangement-before-after.png"
    VisualType = "shoes"
    ImageText = "Before / After"
    PinTitle = "L’entrée peut vite devenir un désordre total 😂"
    Description = @"
Les chaussures qui traînent partout… classique.
✔ entrée propre
✔ accès rapide
✔ meilleur visuel
Voir ici 👇
$LinkShoes1
"@
    ProductType = "Étagère à chaussures"
    AffiliateLink = $LinkShoes1
    BoardName = "Entrée organisée"
    AltText = "Pin Pinterest montrant une entrée rangée avec une étagère à chaussures."
    Accent = "#8B6F5A"
    Dark = "#2C241E"
    Background = "#F7F4EE"
  }
  [ordered]@{
    Id = 7
    FileName = "07-organisateur-tiroir-game-changer.png"
    VisualType = "drawer_focus"
    ImageText = "Game changer"
    PinTitle = "Un petit produit qui change beaucoup"
    Description = @"
Certains produits font une vraie différence :
✔ gain de temps
✔ moins de désordre
✔ plus organisé
Lien 👇
$LinkDrawer2
"@
    ProductType = "Organisateur de tiroir"
    AffiliateLink = $LinkDrawer2
    BoardName = "Organisation maison"
    AltText = "Pin Pinterest montrant un organisateur de tiroir propre avec compartiments visibles."
    Accent = "#597B72"
    Dark = "#1F332F"
    Background = "#F7F6F2"
  }
  [ordered]@{
    Id = 8
    FileName = "08-routine-maison-organisee-sous-evier.png"
    VisualType = "routine"
    ImageText = "Simple routine"
    PinTitle = "Une maison organisée, c’est plus simple"
    Description = @"
Quand tout est à sa place :
✔ moins de stress
✔ moins de perte de temps
✔ entretien plus facile
Quelques bons produits suffisent.
Voir 👇
$LinkUnderSink2
"@
    ProductType = "Organisateur sous évier"
    AffiliateLink = $LinkUnderSink2
    BoardName = "Rangement cuisine"
    AltText = "Pin Pinterest montrant une routine simple avec une zone de rangement sous évier organisée."
    Accent = "#A18063"
    Dark = "#27231F"
    Background = "#FAF7F2"
  }
  [ordered]@{
    Id = 9
    FileName = "09-probleme-solution-rangement-sous-evier.png"
    VisualType = "problem_fix"
    ImageText = "Problem → Fix"
    PinTitle = "Si ça ressemble à ça… il y a une solution"
    Description = @"
Le désordre arrive vite dans certaines zones…
Avec le bon système :
✔ organisation rapide
✔ accès simple
✔ résultat propre
Lien 👇
$LinkUnderSink1
"@
    ProductType = "Organisateur sous évier"
    AffiliateLink = $LinkUnderSink1
    BoardName = "Rangement cuisine"
    AltText = "Pin Pinterest montrant un problème de rangement sous évier et une solution organisée."
    Accent = "#6B7F8D"
    Dark = "#222D34"
    Background = "#F6F5F1"
  }
  [ordered]@{
    Id = 10
    FileName = "10-pantry-organisation-contenants-satisfaisant.png"
    VisualType = "satisfying"
    ImageText = "So satisfying"
    PinTitle = "C’est simple… mais très satisfaisant 😍"
    Description = @"
Une organisation propre donne un vrai effet :
✔ visuel agréable
✔ plus fonctionnel
✔ plus simple au quotidien
Facile à reproduire.
Voir 👇
$LinkContainers2
"@
    ProductType = "Contenants transparents / pantry organization"
    AffiliateLink = $LinkContainers2
    BoardName = "Organisation cuisine"
    AltText = "Pin Pinterest montrant des contenants transparents bien alignés pour une organisation satisfaisante."
    Accent = "#7C8060"
    Dark = "#262A20"
    Background = "#F8F7F2"
  }
)

function New-ColorFromHex {
  param([string]$Hex)
  $clean = $Hex.TrimStart("#")
  return [System.Drawing.Color]::FromArgb(
    [Convert]::ToInt32($clean.Substring(0, 2), 16),
    [Convert]::ToInt32($clean.Substring(2, 2), 16),
    [Convert]::ToInt32($clean.Substring(4, 2), 16)
  )
}

function New-AlphaColor {
  param([string]$Hex, [int]$Alpha)
  $base = New-ColorFromHex $Hex
  return [System.Drawing.Color]::FromArgb($Alpha, $base.R, $base.G, $base.B)
}

function New-Font {
  param(
    [int]$Size,
    [System.Drawing.FontStyle]$Style = [System.Drawing.FontStyle]::Regular
  )
  return [System.Drawing.Font]::new("Segoe UI", $Size, $Style, [System.Drawing.GraphicsUnit]::Pixel)
}

function New-RoundedPath {
  param([float]$X, [float]$Y, [float]$W, [float]$H, [float]$R)
  $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $d = $R * 2
  $path.AddArc($X, $Y, $d, $d, 180, 90)
  $path.AddArc($X + $W - $d, $Y, $d, $d, 270, 90)
  $path.AddArc($X + $W - $d, $Y + $H - $d, $d, $d, 0, 90)
  $path.AddArc($X, $Y + $H - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  return $path
}

function Fill-RoundedRect {
  param($G, $Brush, [float]$X, [float]$Y, [float]$W, [float]$H, [float]$R)
  $path = New-RoundedPath $X $Y $W $H $R
  $G.FillPath($Brush, $path)
  $path.Dispose()
}

function Stroke-RoundedRect {
  param($G, $Pen, [float]$X, [float]$Y, [float]$W, [float]$H, [float]$R)
  $path = New-RoundedPath $X $Y $W $H $R
  $G.DrawPath($Pen, $path)
  $path.Dispose()
}

function Draw-CenteredText {
  param($G, [string]$Text, $Font, $Brush, [float]$X, [float]$Y, [float]$W, [float]$H)
  $format = [System.Drawing.StringFormat]::new()
  $format.Alignment = [System.Drawing.StringAlignment]::Center
  $format.LineAlignment = [System.Drawing.StringAlignment]::Center
  $format.Trimming = [System.Drawing.StringTrimming]::EllipsisWord
  $rect = [System.Drawing.RectangleF]::new($X, $Y, $W, $H)
  $G.DrawString($Text, $Font, $Brush, $rect, $format)
  $format.Dispose()
}

function Draw-LeftText {
  param($G, [string]$Text, $Font, $Brush, [float]$X, [float]$Y, [float]$W, [float]$H)
  $format = [System.Drawing.StringFormat]::new()
  $format.Alignment = [System.Drawing.StringAlignment]::Near
  $format.LineAlignment = [System.Drawing.StringAlignment]::Center
  $format.Trimming = [System.Drawing.StringTrimming]::EllipsisWord
  $rect = [System.Drawing.RectangleF]::new($X, $Y, $W, $H)
  $G.DrawString($Text, $Font, $Brush, $rect, $format)
  $format.Dispose()
}

function Draw-Check {
  param($G, [float]$X, [float]$Y, [string]$AccentHex)
  $accent = New-ColorFromHex $AccentHex
  $pen = [System.Drawing.Pen]::new($accent, 8)
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $G.DrawLines($pen, [System.Drawing.PointF[]]@(
    [System.Drawing.PointF]::new($X, $Y + 16),
    [System.Drawing.PointF]::new($X + 18, $Y + 34),
    [System.Drawing.PointF]::new($X + 48, $Y)
  ))
  $pen.Dispose()
}

function Draw-ProductCardBase {
  param($G, [string]$AccentHex)
  $panelBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(245, 255, 255, 255))
  $shadowBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(28, 0, 0, 0))
  $linePen = [System.Drawing.Pen]::new((New-AlphaColor $AccentHex 80), 3)
  Fill-RoundedRect $G $shadowBrush 96 542 808 806 38
  Fill-RoundedRect $G $panelBrush 88 528 824 806 38
  Stroke-RoundedRect $G $linePen 88 528 824 806 38
  $panelBrush.Dispose()
  $shadowBrush.Dispose()
  $linePen.Dispose()
}

function Draw-MiniLabel {
  param($G, [string]$Text, [float]$X, [float]$Y, [string]$AccentHex)
  $font = New-Font 30 ([System.Drawing.FontStyle]::Bold)
  $brush = [System.Drawing.SolidBrush]::new((New-ColorFromHex $AccentHex))
  Draw-CenteredText $G $Text $font $brush $X $Y 220 50
  $font.Dispose()
  $brush.Dispose()
}

function Draw-DrawerGrid {
  param($G, [float]$X, [float]$Y, [float]$W, [float]$H, [string]$AccentHex, [bool]$Messy)
  $wood = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 232, 220, 202))
  $inside = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 249, 247, 241))
  $line = [System.Drawing.Pen]::new((New-AlphaColor $AccentHex 150), 4)
  Fill-RoundedRect $G $wood $X $Y $W $H 22
  Fill-RoundedRect $G $inside ($X + 18) ($Y + 18) ($W - 36) ($H - 36) 16
  if ($Messy) {
    $colors = @("#9A7B6F", "#627C8C", "#7E8A6A", "#C9A66B", "#8F7C55")
    for ($i = 0; $i -lt 18; $i++) {
      $cx = $X + 45 + (($i * 53) % [int]($W - 90))
      $cy = $Y + 54 + (($i * 91) % [int]($H - 120))
      $brush = [System.Drawing.SolidBrush]::new((New-ColorFromHex $colors[$i % $colors.Count]))
      Fill-RoundedRect $G $brush $cx $cy (46 + (($i * 7) % 44)) 22 8
      $brush.Dispose()
    }
  } else {
    $G.DrawLine($line, $X + $W * 0.36, $Y + 26, $X + $W * 0.36, $Y + $H - 26)
    $G.DrawLine($line, $X + $W * 0.66, $Y + 26, $X + $W * 0.66, $Y + $H - 26)
    $G.DrawLine($line, $X + 28, $Y + $H * 0.46, $X + $W - 28, $Y + $H * 0.46)
    $itemBrush = [System.Drawing.SolidBrush]::new((New-AlphaColor $AccentHex 105))
    Fill-RoundedRect $G $itemBrush ($X + 48) ($Y + 52) 82 42 14
    Fill-RoundedRect $G $itemBrush ($X + 166) ($Y + 70) 64 150 18
    Fill-RoundedRect $G $itemBrush ($X + 282) ($Y + 60) 70 54 14
    Fill-RoundedRect $G $itemBrush ($X + 306) ($Y + 198) 86 42 14
    $itemBrush.Dispose()
  }
  $wood.Dispose()
  $inside.Dispose()
  $line.Dispose()
}

function Draw-DrawerBeforeAfter {
  param($G, [string]$AccentHex)
  Draw-ProductCardBase $G $AccentHex
  Draw-MiniLabel $G "Before" 180 598 $AccentHex
  Draw-MiniLabel $G "After" 610 598 $AccentHex
  Draw-DrawerGrid $G 138 676 326 462 $AccentHex $true
  Draw-DrawerGrid $G 536 676 326 462 $AccentHex $false
  $arrowPen = [System.Drawing.Pen]::new((New-ColorFromHex $AccentHex), 9)
  $arrowPen.EndCap = [System.Drawing.Drawing2D.LineCap]::ArrowAnchor
  $G.DrawLine($arrowPen, 472, 906, 520, 906)
  $arrowPen.Dispose()
}

function Draw-UnderSink {
  param($G, [string]$AccentHex, [bool]$Split = $false)
  Draw-ProductCardBase $G $AccentHex
  $cabinet = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 237, 226, 211))
  $inside = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 251, 249, 244))
  $accent = [System.Drawing.SolidBrush]::new((New-AlphaColor $AccentHex 145))
  $line = [System.Drawing.Pen]::new((New-ColorFromHex $AccentHex), 5)
  Fill-RoundedRect $G $cabinet 190 610 620 560 28
  Fill-RoundedRect $G $inside 230 670 540 430 20
  $G.DrawArc($line, 420, 618, 160, 150, 0, 180)
  $G.DrawLine($line, 500, 690, 500, 790)
  $G.DrawLine($line, 500, 790, 548, 790)
  $G.DrawLine($line, 548, 790, 548, 840)
  $G.DrawLine($line, 292, 888, 708, 888)
  $G.DrawLine($line, 292, 1008, 708, 1008)
  $G.DrawLine($line, 312, 830, 312, 1062)
  $G.DrawLine($line, 688, 830, 688, 1062)
  for ($i = 0; $i -lt 5; $i++) {
    $x = 334 + ($i * 68)
    Fill-RoundedRect $G $accent $x 918 42 78 12
    Fill-RoundedRect $G $accent ($x + 7) 895 28 30 9
  }
  for ($i = 0; $i -lt 4; $i++) {
    $x = 352 + ($i * 82)
    Fill-RoundedRect $G $accent $x 1025 62 38 11
  }
  $cabinet.Dispose()
  $inside.Dispose()
  $accent.Dispose()
  $line.Dispose()
}

function Draw-Pantry {
  param($G, [string]$AccentHex, [bool]$Symmetry = $false)
  Draw-ProductCardBase $G $AccentHex
  $shelfPen = [System.Drawing.Pen]::new((New-ColorFromHex $AccentHex), 6)
  $jarBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(130, 255, 255, 255))
  $capBrush = [System.Drawing.SolidBrush]::new((New-AlphaColor $AccentHex 120))
  $labelBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 245, 239, 229))
  $borderPen = [System.Drawing.Pen]::new((New-AlphaColor $AccentHex 120), 3)
  foreach ($y in @(720, 930, 1140)) {
    $G.DrawLine($shelfPen, 190, $y, 810, $y)
  }
  $sizes = @(
    @(218, 610, 112, 178), @(358, 590, 112, 198), @(498, 626, 112, 162), @(638, 602, 112, 186),
    @(244, 810, 132, 172), @(432, 792, 132, 190), @(620, 826, 132, 156),
    @(226, 1028, 104, 168), @(370, 1028, 104, 168), @(514, 1028, 104, 168), @(658, 1028, 104, 168)
  )
  foreach ($s in $sizes) {
    Fill-RoundedRect $G $jarBrush $s[0] $s[1] $s[2] $s[3] 16
    Stroke-RoundedRect $G $borderPen $s[0] $s[1] $s[2] $s[3] 16
    Fill-RoundedRect $G $capBrush ($s[0] + 12) ($s[1] - 14) ($s[2] - 24) 26 9
    Fill-RoundedRect $G $labelBrush ($s[0] + 22) ($s[1] + $s[3] - 64) ($s[2] - 44) 30 8
  }
  if ($Symmetry) {
    Draw-Check $G 456 1226 $AccentHex
  }
  $shelfPen.Dispose()
  $jarBrush.Dispose()
  $capBrush.Dispose()
  $labelBrush.Dispose()
  $borderPen.Dispose()
}

function Draw-MustHave {
  param($G, [string]$AccentHex, [string]$DarkHex)
  Draw-ProductCardBase $G $AccentHex
  $darkBrush = [System.Drawing.SolidBrush]::new((New-ColorFromHex $DarkHex))
  $accentBrush = [System.Drawing.SolidBrush]::new((New-AlphaColor $AccentHex 120))
  $linePen = [System.Drawing.Pen]::new((New-AlphaColor $AccentHex 115), 4)
  $font = New-Font 40 ([System.Drawing.FontStyle]::Bold)
  $items = @("Tiroir", "Sous évier", "Bocaux", "Placard", "Chaussures")
  for ($i = 0; $i -lt $items.Count; $i++) {
    $y = 626 + ($i * 124)
    Fill-RoundedRect $G $accentBrush 198 $y 92 92 22
    $G.DrawEllipse($linePen, 224, $y + 26, 40, 40)
    Draw-LeftText $G $items[$i] $font $darkBrush 326 ($y + 8) 420 76
  }
  $darkBrush.Dispose()
  $accentBrush.Dispose()
  $linePen.Dispose()
  $font.Dispose()
}

function Draw-Closet {
  param($G, [string]$AccentHex)
  Draw-ProductCardBase $G $AccentHex
  $closet = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 234, 225, 212))
  $inside = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 251, 249, 244))
  $fabric = [System.Drawing.SolidBrush]::new((New-AlphaColor $AccentHex 135))
  $line = [System.Drawing.Pen]::new((New-ColorFromHex $AccentHex), 5)
  Fill-RoundedRect $G $closet 218 592 564 646 28
  Fill-RoundedRect $G $inside 258 640 484 546 18
  foreach ($y in @(746, 900, 1054)) {
    $G.DrawLine($line, 286, $y, 714, $y)
  }
  for ($row = 0; $row -lt 3; $row++) {
    for ($col = 0; $col -lt 3; $col++) {
      Fill-RoundedRect $G $fabric (302 + $col * 132) (666 + $row * 154) 96 70 14
    }
  }
  $G.DrawLine($line, 298, 1164, 702, 1164)
  $closet.Dispose()
  $inside.Dispose()
  $fabric.Dispose()
  $line.Dispose()
}

function Draw-Shoes {
  param($G, [string]$AccentHex)
  Draw-ProductCardBase $G $AccentHex
  Draw-MiniLabel $G "Before" 176 598 $AccentHex
  Draw-MiniLabel $G "After" 612 598 $AccentHex
  $floor = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 239, 231, 219))
  $shoe = [System.Drawing.SolidBrush]::new((New-AlphaColor $AccentHex 145))
  $line = [System.Drawing.Pen]::new((New-ColorFromHex $AccentHex), 5)
  Fill-RoundedRect $G $floor 138 684 320 440 24
  Fill-RoundedRect $G $floor 542 684 320 440 24
  for ($i = 0; $i -lt 9; $i++) {
    $x = 172 + (($i * 61) % 220)
    $y = 742 + (($i * 97) % 292)
    Fill-RoundedRect $G $shoe $x $y 92 36 18
  }
  foreach ($y in @(780, 908, 1036)) {
    $G.DrawLine($line, 592, $y, 812, $y)
  }
  for ($row = 0; $row -lt 3; $row++) {
    for ($col = 0; $col -lt 2; $col++) {
      Fill-RoundedRect $G $shoe (612 + $col * 98) (730 + $row * 128) 76 34 16
    }
  }
  $floor.Dispose()
  $shoe.Dispose()
  $line.Dispose()
}

function Draw-DrawerFocus {
  param($G, [string]$AccentHex)
  Draw-ProductCardBase $G $AccentHex
  Draw-DrawerGrid $G 226 650 548 500 $AccentHex $false
  Draw-Check $G 468 1200 $AccentHex
}

function Draw-Routine {
  param($G, [string]$AccentHex, [string]$DarkHex)
  Draw-UnderSink $G $AccentHex
  $darkBrush = [System.Drawing.SolidBrush]::new((New-ColorFromHex $DarkHex))
  $font = New-Font 28 ([System.Drawing.FontStyle]::Bold)
  Draw-LeftText $G "Tout a sa place" $font $darkBrush 332 1198 360 50
  $font.Dispose()
  $darkBrush.Dispose()
}

function Draw-ProblemFix {
  param($G, [string]$AccentHex)
  Draw-ProductCardBase $G $AccentHex
  Draw-MiniLabel $G "Problem" 164 598 $AccentHex
  Draw-MiniLabel $G "Fix" 638 598 $AccentHex
  $floor = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 250, 248, 243))
  $accent = [System.Drawing.SolidBrush]::new((New-AlphaColor $AccentHex 135))
  $line = [System.Drawing.Pen]::new((New-ColorFromHex $AccentHex), 5)
  Fill-RoundedRect $G $floor 138 684 320 440 24
  Fill-RoundedRect $G $floor 542 684 320 440 24
  for ($i = 0; $i -lt 13; $i++) {
    Fill-RoundedRect $G $accent (168 + (($i * 43) % 220)) (740 + (($i * 79) % 280)) (54 + (($i * 7) % 44)) 34 12
  }
  $G.DrawLine($line, 594, 805, 812, 805)
  $G.DrawLine($line, 594, 938, 812, 938)
  foreach ($x in @(626, 700, 774)) {
    Fill-RoundedRect $G $accent $x 832 44 92 12
    Fill-RoundedRect $G $accent ($x - 10) 966 64 42 12
  }
  $floor.Dispose()
  $accent.Dispose()
  $line.Dispose()
}

function Draw-Pin {
  param($Pin)
  $width = 1000
  $height = 1500
  $bg = New-ColorFromHex $Pin.Background
  $accent = New-ColorFromHex $Pin.Accent
  $dark = New-ColorFromHex $Pin.Dark

  $bmp = [System.Drawing.Bitmap]::new($width, $height)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $g.Clear($bg)

  $accentBrush = [System.Drawing.SolidBrush]::new($accent)
  $darkBrush = [System.Drawing.SolidBrush]::new($dark)
  $whiteBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
  $softBrush = [System.Drawing.SolidBrush]::new((New-AlphaColor $Pin.Accent 32))
  $linePen = [System.Drawing.Pen]::new((New-AlphaColor $Pin.Accent 95), 3)

  Fill-RoundedRect $g $softBrush 52 54 896 1392 46
  Stroke-RoundedRect $g $linePen 52 54 896 1392 46

  $tagFont = New-Font 24 ([System.Drawing.FontStyle]::Bold)
  $hookFont = New-Font 86 ([System.Drawing.FontStyle]::Bold)
  $subFont = New-Font 30 ([System.Drawing.FontStyle]::Regular)

  Draw-CenteredText $g "ORGANISATION MAISON" $tagFont $accentBrush 176 120 648 42
  Draw-CenteredText $g $Pin.ImageText $hookFont $darkBrush 104 190 792 220
  Draw-CenteredText $g "Petit changement, gros impact" $subFont $darkBrush 190 414 620 52

  switch ($Pin.VisualType) {
    "drawer_before_after" { Draw-DrawerBeforeAfter $g $Pin.Accent }
    "under_sink" { Draw-UnderSink $g $Pin.Accent }
    "pantry" { Draw-Pantry $g $Pin.Accent $false }
    "must_have" { Draw-MustHave $g $Pin.Accent $Pin.Dark }
    "closet" { Draw-Closet $g $Pin.Accent }
    "shoes" { Draw-Shoes $g $Pin.Accent }
    "drawer_focus" { Draw-DrawerFocus $g $Pin.Accent }
    "routine" { Draw-Routine $g $Pin.Accent $Pin.Dark }
    "problem_fix" { Draw-ProblemFix $g $Pin.Accent }
    "satisfying" { Draw-Pantry $g $Pin.Accent $true }
  }

  $footerFont = New-Font 27 ([System.Drawing.FontStyle]::Bold)
  Fill-RoundedRect $g $accentBrush 278 1360 444 62 24
  Draw-CenteredText $g "Voir la solution" $footerFont $whiteBrush 302 1367 396 46

  $outPath = Join-Path $PinsDir $Pin.FileName
  $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)

  $g.Dispose()
  $bmp.Dispose()
  $accentBrush.Dispose()
  $darkBrush.Dispose()
  $whiteBrush.Dispose()
  $softBrush.Dispose()
  $linePen.Dispose()
  $tagFont.Dispose()
  $hookFont.Dispose()
  $subFont.Dispose()
  $footerFont.Dispose()

  Copy-Item -LiteralPath $outPath -Destination (Join-Path $UploadDir $Pin.FileName) -Force
}

function ConvertTo-CsvCell {
  param($Value)
  $s = [string]$Value
  $s = $s -replace "`r`n", "\n"
  $s = $s -replace "`n", "\n"
  return '"' + ($s -replace '"', '""') + '"'
}

foreach ($pin in $Pins) {
  Draw-Pin $pin
  $captionPath = Join-Path $CaptionsDir ("pin_{0:00}_caption.txt" -f $pin.Id)
  $caption = @"
Titre Pinterest:
$($pin.PinTitle)

Description Pinterest:
$($pin.Description.Trim())

Lien affilié:
$($pin.AffiliateLink)

Board:
$($pin.BoardName)

Alt text:
$($pin.AltText)

Status:
$Status
"@
  Set-Content -LiteralPath $captionPath -Value $caption -Encoding UTF8
}

$headers = @("filename", "pin_title", "pin_description", "product_type", "affiliate_link", "board_name", "alt_text", "status")
$rows = @($headers -join ",")
foreach ($pin in $Pins) {
  $rows += @(
    ConvertTo-CsvCell $pin.FileName
    ConvertTo-CsvCell $pin.PinTitle
    ConvertTo-CsvCell $pin.Description.Trim()
    ConvertTo-CsvCell $pin.ProductType
    ConvertTo-CsvCell $pin.AffiliateLink
    ConvertTo-CsvCell $pin.BoardName
    ConvertTo-CsvCell $pin.AltText
    ConvertTo-CsvCell $Status
  ) -join ","
}

Set-Content -LiteralPath (Join-Path $Root "manifest.csv") -Value $rows -Encoding UTF8
Set-Content -LiteralPath (Join-Path $UploadDir "manifest_upload.csv") -Value $rows -Encoding UTF8

$json = $Pins | ForEach-Object {
  [ordered]@{
    id = $_.Id
    filename = $_.FileName
    pin_title = $_.PinTitle
    pin_description = $_.Description.Trim()
    product_type = $_.ProductType
    affiliate_link = $_.AffiliateLink
    board_name = $_.BoardName
    alt_text = $_.AltText
    status = $Status
  }
} | ConvertTo-Json -Depth 4
Set-Content -LiteralPath (Join-Path $AssetsDir "pin-copy.json") -Value $json -Encoding UTF8

$sourceNotes = @"
# Notes sur les sources visuelles

Statut: visuels provisoires non Amazon.

Les pins ont été générées en 1000 x 1500 avec des compositions propres et stylisées pour représenter les angles demandés. Aucune image Amazon.ca n'a été téléchargée ou réutilisée. Les liens affiliés ont été ajoutés avec le tag $AffiliateTag, mais les images produit Amazon autorisées restent à confirmer.

Pour finaliser avec les visuels Amazon demandés, fournir ou confirmer pour chaque produit:
- URL Amazon.ca /dp/ASIN directe
- confirmation que l'utilisation des images produit est autorisée selon le programme Amazon Associates, idéalement via Product Advertising API ou assets approuvés

Si l'utilisation directe des images visibles sur Amazon.ca n'est pas conforme ou techniquement bloquée, remplacer les visuels par des images autorisées fournies par le marchand, l'API Amazon PA, ou des visuels libres de droits clairement compatibles.
"@
Set-Content -LiteralPath (Join-Path $AssetsDir "visual-source-notes.md") -Value $sourceNotes -Encoding UTF8

$uploadNotes = @"
# Upload notes

Ce dossier contient les 10 PNG et un manifest de publication.

Publication Pinterest non effectuée:
- aucun accès Pinterest Business/API n'est disponible dans cette session
- aucun board ID ou outil de planification n'a été fourni
- les liens affiliés Amazon ont été ajoutés avec le tag $AffiliateTag
- les visuels Amazon source ne sont pas encore intégrés

Avant publication, valider les liens, remplacer le lien court Rubbermaid par un lien /dp/ASIN direct si souhaité, puis intégrer les images Amazon autorisées.
"@
Set-Content -LiteralPath (Join-Path $UploadDir "UPLOAD_NOTES.md") -Value $uploadNotes -Encoding UTF8

$pinList = ($Pins | ForEach-Object { "- pins/$($_.FileName)" }) -join "`n"
$captionList = ($Pins | ForEach-Object { "- captions/pin_{0:00}_caption.txt" -f $_.Id }) -join "`n"
$uploadList = ($Pins | ForEach-Object { "- upload/$($_.FileName)" }) -join "`n"

$readme = @"
# Pinterest Launch - Organisation maison

## Fichiers créés

Structure générée:
- assets/
- pins/
- captions/
- upload/
- manifest.csv
- README.md

Pins PNG 1000 x 1500:
$pinList

Captions:
$captionList

Fichiers upload:
$uploadList
- upload/manifest_upload.csv
- upload/UPLOAD_NOTES.md

Assets:
- assets/pin-copy.json
- assets/visual-source-notes.md

## Pins prêtes

Les 10 angles demandés ont été créés en version brouillon premium:
1. tiroir avant / après
2. sous évier
3. cuisine esthétique
4. liste de produits
5. placard petit espace
6. chaussures entrée
7. produit simple gros impact
8. routine simple
9. problème → solution
10. satisfaisant visuel

## Publication

Aucune pin n'a été publiée sur Pinterest.

Raisons:
- accès Pinterest non fourni
- board ID ou scheduler non fourni
- liens affiliés Amazon ajoutés avec le tag $AffiliateTag
- lien court Amazon fourni pour Rubbermaid pin 3
- ASIN direct Vtopmart B08ZK5WDWN fourni pour pin 10
- visuels Amazon.ca non intégrés

## Informations manquantes

Pour rendre les pins publiables:
- URL /dp/ASIN directe longue pour Rubbermaid Brilliance contenants, optionnelle si tu veux éviter le lien court amzn.to
- confirmation de conformité pour utiliser les images Amazon visibles sur les fiches produit
- accès Pinterest Business/API, ou outil de planification, ou publication manuelle

## Notes de conformité

Les visuels actuels sont des maquettes stylisées. Ils ne réutilisent pas d'images Amazon.ca.

La règle demandée de priorité aux images Amazon est documentée dans assets/visual-source-notes.md. Elle pourra être appliquée dès que les pages produit et les liens affiliés exacts seront fournis.

## Prochaine étape vers 50 pins

Créer une matrice 5 produits x 10 angles:
- avant/après
- problème → solution
- top 3 erreurs
- produit discret, gros impact
- petit espace
- routine rapide
- checklist rangement
- résultat satisfaisant
- achat utile
- comparaison zone désordre / zone organisée

Une fois les liens Amazon.ca et les images autorisées ajoutés, décliner chaque angle avec 2 hooks et 2 compositions pour obtenir rapidement 50 à 100 variations testables.
"@
Set-Content -LiteralPath (Join-Path $Root "README.md") -Value $readme -Encoding UTF8

"Generated $($Pins.Count) Pinterest pins in $Root"
